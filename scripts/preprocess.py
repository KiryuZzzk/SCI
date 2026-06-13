#!/usr/bin/env python3
"""
CoberturaECMX — Data preprocessing pipeline
Transforma datos reales del gobierno en JSON estáticos para el frontend.

Archivos en scripts/data/raw/:
  colonias-cdmx-.json          → INEGI colonias CDMX
  limite-de-las-alcaldas.json  → INEGI alcaldías CDMX
  llamadas_911_2022_s1.csv     → C5 llamadas 911
  inViales_2022_2024.csv       → C5 incidentes viales
  ITER_09CSV20.csv             → INEGI censo 2020 por localidad (población)
  BD ABIERTOS SECTORIAL 2024.csv → SSA recursos salud (sin coords)

Salida en public/data/:
  colonias.geojson, alcaldias.geojson, incidents-by-colonia.json,
  hospitals.json, fire-stations.json, metadata.json
"""

import json, csv, re, unicodedata, os, sys
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent.parent
RAW  = Path(__file__).parent / 'data' / 'raw'
OUT  = ROOT / 'public' / 'data'
OUT.mkdir(parents=True, exist_ok=True)

# ── helpers ────────────────────────────────────────────────────────────────────
def log(msg):
    try:
        print(f'[preprocess] {msg}', flush=True)
    except UnicodeEncodeError:
        print(f'[preprocess] {msg}'.encode('ascii', 'replace').decode('ascii'), flush=True)

def norm(s):
    """Normaliza nombre para matching: mayúsculas, sin acentos, sin puntuación extra."""
    if not s: return ''
    s = s.upper().strip()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'\s+', ' ', s)
    return s

def read_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    kb = os.path.getsize(path) / 1024
    log(f'  -> {path.name}  ({kb:.0f} KB)')

def read_csv(path, encoding='utf-8-sig'):
    with open(path, encoding=encoding, errors='replace') as f:
        return list(csv.DictReader(f))

def read_csv_iter(path, encoding='utf-8-sig'):
    """Generator para CSVs grandes."""
    with open(path, encoding=encoding, errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row

# ── Stage 1: GeoJSON colonias ──────────────────────────────────────────────────
def process_colonias():
    log('Stage 1: colonias GeoJSON...')
    fpath = RAW / 'colonias-cdmx-.json'
    gj = read_json(fpath)

    # Construir lookup nombre→CVE_GEO para matching posterior
    # CVEUT = "02-001" → CVE_GEO = "09-02-001" para mayor unicidad
    name_to_cve = {}  # (norm_alcaldia, norm_colonia) → cve_geo

    for feat in gj['features']:
        p = feat['properties']
        # CVEUT = "02-001" es el ID único de colonia — usarlo directamente como CVE_GEO
        cve = '09-' + p['CVEUT']   # ej: "09-02-001"

        p['CVE_GEO']    = cve
        p['NOMGEO']     = p['NOMUT']
        p['NOMGEO_ALC'] = p['NOMDT']
        p['CVE_ALC']    = p['CVEDT']
        p['population'] = 0  # se llena en Stage 3

        # índice para matching por nombre
        key = (norm(p['NOMDT']), norm(p['NOMUT']))
        name_to_cve[key] = cve

        # Limpiar propiedades sobrantes
        feat['properties'] = {
            'CVE_GEO':    cve,
            'NOMGEO':     p['NOMUT'],
            'NOMGEO_ALC': p['NOMDT'],
            'CVE_ALC':    p['CVEDT'],
            'population': 0,
        }

    log(f'  Colonias: {len(gj["features"]):,}')
    return gj, name_to_cve

# ── Stage 2: GeoJSON alcaldías ─────────────────────────────────────────────────
def process_alcaldias():
    log('Stage 2: alcaldías GeoJSON...')
    fpath = RAW / 'limite-de-las-alcaldas.json'
    gj = read_json(fpath)
    # Ya tiene CVEGEO, CVE_MUN, NOMGEO — solo aseguramos formato consistente
    for feat in gj['features']:
        p = feat['properties']
        feat['properties'] = {
            'CVE_MUN': p.get('CVE_MUN', ''),
            'NOMGEO':  p.get('NOMGEO', ''),
            'CVEGEO':  p.get('CVEGEO', ''),
        }
    write_json(OUT / 'alcaldias.geojson', gj)
    log(f'  Alcaldías: {len(gj["features"]):,}')
    return {norm(f['properties']['NOMGEO']): f['properties']['CVE_MUN']
            for f in gj['features']}

# ── Stage 3: Población por alcaldía → colonias ─────────────────────────────────
def process_population(colonias_gj):
    log('Stage 3: población ITER_09CSV20...')
    fpath = RAW / 'ITER_09CSV20.csv'

    # Leer totales por municipio (alcaldía)
    # Excluir filas de totales: LOC = '0000' y MUN = '000'
    pop_by_mun = {}  # CVE_MUN (ej '002') → POBTOT
    with open(fpath, encoding='utf-8-sig', errors='replace') as f:
        for row in csv.DictReader(f):
            mun = row.get('MUN', '').strip()
            loc = row.get('LOC', '').strip()
            if mun == '000' or loc != '0000':
                continue
            try:
                pop = int(str(row.get('POBTOT', '0')).replace(',', '').strip() or 0)
            except ValueError:
                pop = 0
            pop_by_mun[mun] = pop

    log(f'  Alcaldías con población: {len(pop_by_mun)}')

    # Contar colonias por alcaldía para distribución uniforme
    colonias_por_alc = defaultdict(list)
    for feat in colonias_gj['features']:
        cve_alc = feat['properties']['CVE_ALC']
        colonias_por_alc[cve_alc].append(feat)

    # Asignar población proporcional (área como peso si shapely disponible, sino uniforme)
    total_asignado = 0
    try:
        from shapely.geometry import shape as shp_shape
        use_area = True
        log('  Usando área de polígono para distribución de población (shapely disponible)')
    except ImportError:
        use_area = False
        log('  Shapely no disponible → distribución uniforme por colonia')

    for cve_alc, feats in colonias_por_alc.items():
        # CVEDT en GeoJSON es '2', ITER usa '002' → zero-pad para coincidir
        pop_alc = pop_by_mun.get(cve_alc.zfill(3), 0)
        if use_area:
            areas = []
            for feat in feats:
                try:
                    areas.append(shp_shape(feat['geometry']).area)
                except Exception:
                    areas.append(1.0)
            total_area = sum(areas) or 1
            for feat, area in zip(feats, areas):
                assigned = round(pop_alc * area / total_area)
                feat['properties']['population'] = assigned
                total_asignado += assigned
        else:
            n = len(feats) or 1
            per_col = round(pop_alc / n)
            for feat in feats:
                feat['properties']['population'] = per_col
                total_asignado += per_col

    log(f'  Población total asignada: {total_asignado:,}')
    write_json(OUT / 'colonias.geojson', colonias_gj)
    return total_asignado

# ── Stage 4: Incidentes C5 ────────────────────────────────────────────────────
# Categorías 911 → nuestros 4 tipos (UPPERCASE porque norm() devuelve mayúsculas)
CATS_911 = {
    'MEDICOS':    'medical',
    'LESIONADO':  'medical',   # lesionados → atención médica
    'INCENDIO':   'fire',
    'AGRESION':   'security',
    'DISTURBIO':  'security',
    'ROBO':       'security',
    'DENUNCIA':   'security',
    'AMENAZA':    'security',
    'PRIVACION':  'security',
}
# Tipos viales → nuestros tipos (UPPERCASE)
TIPOS_VIALES = {
    'ACCIDENTE': 'traffic',
    'LESIONADO': 'traffic',   # lesionados viales
    'CADAVER':   'traffic',
}

def match_colonia(norm_alc, norm_col, name_to_cve):
    """Busca CVE_GEO por nombre de alcaldía + colonia."""
    key = (norm_alc, norm_col)
    if key in name_to_cve:
        return name_to_cve[key]
    # Fallback: solo por nombre de colonia (puede haber ambigüedad entre alcaldías)
    for (a, c), cve in name_to_cve.items():
        if c == norm_col and (not norm_alc or a == norm_alc):
            return cve
    return None

def process_incidents(name_to_cve):
    log('Stage 4: incidentes C5...')
    by_colonia = defaultdict(lambda: {'byType': defaultdict(int), 'total': 0})
    stats = {'matched': 0, 'unmatched': 0, 'rows': 0}

    # ── 911 ──
    f911 = RAW / 'llamadas_911_2022_s1.csv'
    if f911.exists():
        log('  Leyendo llamadas_911_2022_s1.csv...')
        for row in read_csv_iter(f911):
            stats['rows'] += 1
            cat = norm(row.get('categoria_incidente_c4', ''))
            tipo = None
            for key, val in CATS_911.items():
                if key in cat:
                    tipo = val
                    break
            if not tipo:
                continue

            alc = norm(row.get('alcaldia_cierre', ''))
            col = norm(row.get('colonia_cierre', ''))
            cve = match_colonia(alc, col, name_to_cve)

            if cve:
                by_colonia[cve]['byType'][tipo] += 1
                by_colonia[cve]['total'] += 1
                stats['matched'] += 1
            else:
                stats['unmatched'] += 1

    # ── Viales ──
    fviales = RAW / 'inViales_2022_2024.csv'
    if fviales.exists():
        log('  Leyendo inViales_2022_2024.csv...')
        for row in read_csv_iter(fviales):
            stats['rows'] += 1
            tipo_raw = norm(row.get('tipo_incidente_c4', ''))
            tipo = None
            for key, val in TIPOS_VIALES.items():
                if key in tipo_raw:
                    tipo = val
                    break
            if not tipo:
                continue

            alc = norm(row.get('alcaldia_catalogo', ''))
            col = norm(row.get('colonia_catalogo', ''))
            cve = match_colonia(alc, col, name_to_cve)

            if cve:
                by_colonia[cve]['byType'][tipo] += 1
                by_colonia[cve]['total'] += 1
                stats['matched'] += 1
            else:
                stats['unmatched'] += 1

    result = {cve: {'byType': dict(d['byType']), 'total': d['total']}
              for cve, d in by_colonia.items()}
    write_json(OUT / 'incidents-by-colonia.json', {'data': result})
    match_pct = stats['matched'] / max(stats['matched'] + stats['unmatched'], 1) * 100
    log(f'  Filas: {stats["rows"]:,}  |  Colonias: {len(result):,}  |  Match: {match_pct:.1f}%')
    return len(result), stats['rows']

# ── Stage 5: Hospitales (BD ABIERTOS SECTORIAL) ────────────────────────────────
def process_hospitals():
    log('Stage 5: hospitales SSA...')
    fpath = RAW / 'BD ABIERTOS SECTORIAL 2024.csv'

    # Tipos de establecimiento que consideramos como "hospital" para el score
    TIPOS_HOSP = {
        'HOSPITAL GENERAL', 'HOSPITAL ESPECIALIZADO', 'HOSPITAL INTEGRAL',
        'HOSPITAL REGIONAL', 'HOSPITAL COMUNITARIO', 'CLINICA HOSPITAL',
        'UNIDAD MEDICA DE ALTA ESPECIALIDAD', 'INSTITUTO NACIONAL',
    }

    hospitals_named = []
    with open(fpath, encoding='latin-1', errors='replace') as f:
        for row in csv.DictReader(f):
            if row.get('Clave Estado', '').strip() not in ('09', '9'):
                continue
            tipo = row.get('Tipo de Establecimiento', '').strip().upper()
            tipologia = row.get('Tipología', '').strip().upper()
            tiene_urgencias = row.get('¿Cuenta con área de urgencias?', '0').strip()
            camas_hosp = row.get('TOTAL CAMAS AREA HOSPITALIZACIÓN', '0').strip()

            # Incluir si es hospital o tiene área de urgencias y camas
            es_hospital = any(t in tipo or t in tipologia for t in TIPOS_HOSP)
            tiene_camas = int(camas_hosp or 0) > 0
            tiene_urg = tiene_urgencias == '1'

            if not (es_hospital or (tiene_camas and tiene_urg)):
                continue

            hospitals_named.append({
                'clues':       row.get('CLUES', '').strip(),
                'nombre':      row.get('Nombre de la Unidad', '').strip(),
                'institucion': row.get('Institución', '').strip(),
                'tipo':        tipo,
                'municipio':   row.get('Nombre Municipio', '').strip(),
                'camas':       int(camas_hosp or 0),
                # Sin coordenadas en este archivo
                'lat': None,
                'lng': None,
            })

    # Intentar enriquecer con coordenadas si existe el catálogo CLUES con coords
    clues_coords_path = RAW / 'clues_coords.csv'
    enriched = 0
    if clues_coords_path.exists():
        log('  Enriqueciendo con coordenadas de clues_coords.csv...')
        coords_map = {}
        with open(clues_coords_path, encoding='latin-1', errors='replace') as f:
            for row in csv.DictReader(f):
                clues_key = row.get('CLUES', row.get('clues', '')).strip()
                try:
                    lat = float(row.get('LATITUD', row.get('latitud', '')) or 0)
                    lng = float(row.get('LONGITUD', row.get('longitud', '')) or 0)
                    if lat and lng:
                        coords_map[clues_key] = (lat, lng)
                except (ValueError, TypeError):
                    pass
        for h in hospitals_named:
            if h['clues'] in coords_map:
                h['lat'], h['lng'] = coords_map[h['clues']]
                enriched += 1

    # Solo exportar los que tienen coordenadas
    with_coords = [h for h in hospitals_named if h['lat'] and h['lng']]
    without_coords = [h for h in hospitals_named if not h['lat']]

    write_json(OUT / 'hospitals.json', with_coords)
    log(f'  Hospitales CDMX encontrados: {len(hospitals_named)}')
    log(f'  Con coordenadas: {len(with_coords)}  |  Sin coords: {len(without_coords)}')
    if without_coords:
        log(f'  ⚠️  Para agregar coords: descarga clues_coords.csv de dgis.salud.gob.mx')
        log(f'     y ponlo en scripts/data/raw/  (necesita columnas CLUES, LATITUD, LONGITUD)')

    return len(with_coords)

# ── Stage 6: Estaciones de bomberos ───────────────────────────────────────────
FIRE_STATIONS_HARDCODED = [
    {'nombre': 'Estación Central',          'alcaldia': 'Cuauhtémoc',             'lat': 19.4280, 'lng': -99.1401},
    {'nombre': 'Estación Norte',             'alcaldia': 'Gustavo A. Madero',      'lat': 19.4890, 'lng': -99.1201},
    {'nombre': 'Estación Oriente',           'alcaldia': 'Iztapalapa',             'lat': 19.3650, 'lng': -99.0510},
    {'nombre': 'Estación Sur',               'alcaldia': 'Xochimilco',             'lat': 19.2580, 'lng': -99.1020},
    {'nombre': 'Estación Poniente',          'alcaldia': 'Álvaro Obregón',         'lat': 19.3720, 'lng': -99.2100},
    {'nombre': 'Estación Tlalpan',           'alcaldia': 'Tlalpan',                'lat': 19.2950, 'lng': -99.1700},
    {'nombre': 'Estación Coyoacán',          'alcaldia': 'Coyoacán',               'lat': 19.3500, 'lng': -99.1630},
    {'nombre': 'Estación Benito Juárez',     'alcaldia': 'Benito Juárez',          'lat': 19.3980, 'lng': -99.1580},
    {'nombre': 'Estación Iztacalco',         'alcaldia': 'Iztacalco',              'lat': 19.3950, 'lng': -99.1050},
    {'nombre': 'Estación Venustiano Carranza','alcaldia': 'Venustiano Carranza',   'lat': 19.4250, 'lng': -99.0850},
    {'nombre': 'Estación Azcapotzalco',      'alcaldia': 'Azcapotzalco',           'lat': 19.4850, 'lng': -99.1850},
    {'nombre': 'Estación Miguel Hidalgo',    'alcaldia': 'Miguel Hidalgo',         'lat': 19.4350, 'lng': -99.2000},
    {'nombre': 'Estación Magdalena Contreras','alcaldia': 'La Magdalena Contreras','lat': 19.3300, 'lng': -99.2400},
    {'nombre': 'Estación Cuajimalpa',        'alcaldia': 'Cuajimalpa',             'lat': 19.3600, 'lng': -99.2950},
    {'nombre': 'Estación Milpa Alta',        'alcaldia': 'Milpa Alta',             'lat': 19.1900, 'lng': -99.0220},
    {'nombre': 'Estación Tláhuac',           'alcaldia': 'Tláhuac',                'lat': 19.2910, 'lng': -99.0050},
    {'nombre': 'Estación Santa Fe',          'alcaldia': 'Álvaro Obregón',         'lat': 19.3680, 'lng': -99.2580},
    {'nombre': 'Estación Pedregal',          'alcaldia': 'Coyoacán',               'lat': 19.3260, 'lng': -99.1780},
    {'nombre': 'Estación Tacubaya',          'alcaldia': 'Miguel Hidalgo',         'lat': 19.4010, 'lng': -99.1900},
    {'nombre': 'Estación Tepito',            'alcaldia': 'Cuauhtémoc',             'lat': 19.4420, 'lng': -99.1250},
    {'nombre': 'Estación Ecatepec (apoyo)',  'alcaldia': 'Gustavo A. Madero',      'lat': 19.5410, 'lng': -99.0540},
]

def process_fire_stations():
    log('Stage 6: estaciones de bomberos...')
    # Usar archivo si existe, si no usar hardcoded
    fpath = RAW / 'fire_stations.csv'
    if fpath.exists():
        stations = []
        for row in read_csv(fpath):
            try:
                stations.append({
                    'lat':      float(row.get('lat') or row.get('LATITUD') or 0),
                    'lng':      float(row.get('lng') or row.get('lon') or row.get('LONGITUD') or 0),
                    'nombre':   row.get('nombre') or row.get('NOMBRE') or '',
                    'alcaldia': row.get('alcaldia') or row.get('ALCALDIA') or '',
                })
            except (ValueError, TypeError):
                pass
    else:
        log('  Usando 21 estaciones hardcoded (geocodificadas manualmente)')
        stations = FIRE_STATIONS_HARDCODED

    write_json(OUT / 'fire-stations.json', stations)
    log(f'  Estaciones: {len(stations)}')
    return len(stations)

# ── Stage 7: Metadata ──────────────────────────────────────────────────────────
def write_metadata(colonias_count, incidents_count, rows_count, hospital_count, fire_count):
    log('Stage 7: metadata...')
    meta = {
        'processedAt': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'version': '1.1.0',
        'sources': {
            'c5': {
                'url': 'https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911',
                'records': rows_count,
                'period': '2022-2024',
            },
            'inegi': {
                'url': 'https://datos.cdmx.gob.mx/dataset/coloniascdmx',
                'colonias': colonias_count,
            },
            'ssa': {
                'url': 'https://www.gob.mx/salud/documentos/datos-abiertos-190024',
                'records': hospital_count,
                'nota': 'Sin coordenadas — agregar clues_coords.csv para habilitar',
            },
            'bomberos': {
                'url': 'https://bomberos.cdmx.gob.mx/estaciones',
                'records': fire_count,
            },
        },
        'stats': {
            'coloniasWithIncidents': incidents_count,
            'totalColonias': colonias_count,
        },
    }
    with open(OUT / 'metadata.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    log(f'  → metadata.json')

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    log('=' * 60)
    log('CoberturaECMX — pipeline de datos reales')
    log(f'Input:  {RAW}')
    log(f'Output: {OUT}')
    log('=' * 60)

    colonias_gj, name_to_cve = process_colonias()
    process_alcaldias()
    process_population(colonias_gj)   # modifica colonias_gj in-place, luego escribe
    incidents_count, rows_count = process_incidents(name_to_cve)
    hospital_count  = process_hospitals()
    fire_count      = process_fire_stations()
    write_metadata(len(colonias_gj['features']), incidents_count, rows_count, hospital_count, fire_count)

    log('=' * 60)
    log('Listo. Archivos escritos en public/data/')
    if hospital_count == 0:
        log('')
        log('  NOTA: hospitals.json está vacío porque BD ABIERTOS SECTORIAL no')
        log('  incluye coordenadas. Para activarlos, descarga el catálogo CLUES')
        log('  con coordenadas de:')
        log('  https://datos.gob.mx/busca/dataset/catalogo-de-clues-unidades-medicas-del-sector-salud')
        log('  Guárdalo como scripts/data/raw/clues_coords.csv y vuelve a correr el script.')

if __name__ == '__main__':
    main()
