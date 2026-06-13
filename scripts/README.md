# CoberturaECMX — Data Pipeline

## How to update data

```bash
# 1. Download fresh data to scripts/data/raw/  (see Sources below)
# 2. Run the pipeline
python scripts/preprocess.py
# 3. Verify output in public/data/
# 4. Deploy (git push or vercel deploy)
```

---

## Required files in `scripts/data/raw/`

| File | Source | Notes |
|------|--------|-------|
| `c5_911.csv` | [C5 — Llamadas 911](https://datos.cdmx.gob.mx/dataset/llamadas-numero-de-atencion-a-emergencias-911) | Descargar CSV semestral más reciente |
| `c5_viales.csv` | [C5 — Incidentes viales](https://datos.cdmx.gob.mx/dataset/incidentes-viales-c5) | CSV anual |
| `colonias.geojson` | [INEGI — Colonias](https://datos.cdmx.gob.mx/dataset/coloniascdmx) | GeoJSON o convertir SHP con `ogr2ogr` |
| `alcaldias.geojson` | [INEGI — Alcaldías](https://datos.cdmx.gob.mx/dataset/alcaldias) | GeoJSON |
| `censo_manzanas.csv` | [INEGI — Censo 2020](https://www.inegi.org.mx/programas/ccpv/2020/default.html#Microdatos) | CSV de manzanas CDMX (para población) |
| `clues.csv` | [CLUES — Establecimientos de salud](https://www.gob.mx/salud/documentos/datos-abiertos-190024) | CSV nacional, el script filtra CDMX |
| `fire_stations.csv` | Geocodificación manual (ver abajo) | 21 estaciones |

> `scripts/data/raw/` está en `.gitignore` por el tamaño de los archivos.

---

## fire_stations.csv — formato esperado

```csv
nombre,alcaldia,lat,lng,telefono
Estación 1 - Centro,Cuauhtémoc,19.4280,-99.1380,55-XXXX-XXXX
...
```

### Estaciones de bomberos CDMX (geocodificadas)

| # | Nombre | Alcaldía | Lat | Lng |
|---|--------|----------|-----|-----|
| 1 | Estación Central | Cuauhtémoc | 19.4280 | -99.1401 |
| 2 | Estación Norte | Gustavo A. Madero | 19.4890 | -99.1201 |
| 3 | Estación Oriente | Iztapalapa | 19.3650 | -99.0510 |
| 4 | Estación Sur | Xochimilco | 19.2580 | -99.1020 |
| 5 | Estación Poniente | Álvaro Obregón | 19.3720 | -99.2100 |
| 6 | Estación Tlalpan | Tlalpan | 19.2950 | -99.1700 |
| 7 | Estación Coyoacán | Coyoacán | 19.3500 | -99.1630 |
| 8 | Estación Benito Juárez | Benito Juárez | 19.3980 | -99.1580 |
| 9 | Estación Iztacalco | Iztacalco | 19.3950 | -99.1050 |
| 10 | Estación Venustiano Carranza | V. Carranza | 19.4250 | -99.0850 |
| 11 | Estación Azcapotzalco | Azcapotzalco | 19.4850 | -99.1850 |
| 12 | Estación Miguel Hidalgo | Miguel Hidalgo | 19.4350 | -99.2000 |
| 13 | Estación Magdalena Contreras | M. Contreras | 19.3300 | -99.2400 |
| 14 | Estación Cuajimalpa | Cuajimalpa | 19.3600 | -99.2950 |
| 15 | Estación Milpa Alta | Milpa Alta | 19.1900 | -99.0220 |
| 16 | Estación Tláhuac | Tláhuac | 19.2910 | -99.0050 |
| 17 | Estación Santa Fe | Álvaro Obregón | 19.3680 | -99.2580 |
| 18 | Estación Pedregal | Coyoacán | 19.3260 | -99.1780 |
| 19 | Estación Tacubaya | Miguel Hidalgo | 19.4010 | -99.1900 |
| 20 | Estación Tepito | Cuauhtémoc | 19.4420 | -99.1250 |
| 21 | Estación Ecatepec (apoyo) | G. A. Madero | 19.5410 | -99.0540 |

> Verificar coordenadas en [bomberos.cdmx.gob.mx/estaciones](https://bomberos.cdmx.gob.mx/estaciones)

---

## Converting SHP to GeoJSON

If INEGI provides shapefiles instead of GeoJSON:

```bash
# Install GDAL
brew install gdal   # macOS
# or: pip install gdal

# Convert
ogr2ogr -f GeoJSON colonias.geojson colonias.shp -t_srs EPSG:4326
ogr2ogr -f GeoJSON alcaldias.geojson alcaldias.shp -t_srs EPSG:4326
```

---

## Output files in `public/data/`

| File | Size (approx) | Description |
|------|--------------|-------------|
| `colonias.geojson` | ~3 MB | 1,812 colonia polygons + population |
| `alcaldias.geojson` | ~200 KB | 16 alcaldía boundaries |
| `incidents-by-colonia.json` | ~200 KB | Incident counts by colonia and type |
| `hospitals.json` | ~100 KB | ~480 hospitals in CDMX |
| `fire-stations.json` | ~5 KB | 21 fire stations |
| `metadata.json` | ~1 KB | Version, date, source URLs |
