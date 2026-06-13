# SCI Simulator — Plan maestro de profesionalización

**Estado:** aprobado por usuario (fenrirnott@gmail.com) — 2026-05-26
**Decisiones fijadas:**
1. PDF: añadir `jsPDF` como dependencia (~45kb)
2. Personal ICS: simular con nombres mock (no dropdown vacío)
3. Numeración: **solo formal** (`INC-2026-0526-0001`) — eliminar `SCI-S001` etc.
4. Orden de ejecución: Fase 1 (export) → Fase 2 (visual) → Fase 3 (ICS) → Fase 4 (forms) → Fase 5 (datos)

---

## Convenciones generales

- **Idioma UI:** Español MX
- **Idioma código/comentarios:** Español o inglés según convenga; mantener consistencia local
- **Timestamps internos:** `Date.now()` (ms epoch); display configurable UTC ↔ local
- **Display por defecto:** local (America/Mexico_City), con badge `Z` para UTC
- **Caveman mode ON:** mensajes al usuario en fragmentos cortos
- **Sin emojis decorativos** en logs/reports — solo en mapa donde aportan información

---

# FASE 1 · Exportación de log

**Objetivo:** botón funcional "Exportar" que produce CSV / PDF / JSON / Markdown / TXT del log de eventos.

## 1.1 Dependencia

```bash
npm install jspdf
```

## 1.2 Archivos nuevos

### `src/utils/format/csv.js`
```js
// Build CSV string from log entries
// Columns: timestamp_iso, timestamp_local, level, incident_id, message
export function logToCSV(entries, { timezone = 'America/Mexico_City' } = {}) { ... }
export function downloadCSV(filename, content) { ... }
```

### `src/utils/format/json.js`
```js
export function logToJSON(entries, meta) { return JSON.stringify({ meta, entries }, null, 2) }
export function downloadJSON(filename, content) { ... }
```

### `src/utils/format/txt.js`
```js
// Plain text — radio-friendly
// Format: [HH:MM:SS] [LVL] [INC-ID] message
export function logToTXT(entries) { ... }
```

### `src/utils/format/markdown.js`
```js
// Markdown table or list with headers per OP
export function logToMarkdown(entries, meta) { ... }
```

### `src/utils/format/pdf.js`
```js
import jsPDF from 'jspdf'
// Generic PDF builder — used by exportLog AND ICS forms
export function buildPDF({ title, subtitle, sections, tableRows }) { ... }
export function downloadPDF(filename, blob) { ... }
```

### `src/utils/exportLog.js` — orquestador
```js
// Single entry point. Filters log by scope, calls format util, triggers download.
export function exportLog({
  entries,               // sci.eventLog
  scope = 'all',         // 'all' | 'op' | 'incident' | 'critical' | 'range'
  scopeArg,              // OP id, incident id, [from, to]
  format,                // 'csv' | 'pdf' | 'json' | 'md' | 'txt'
  meta,                  // { incident name, IC, OP, etc. }
}) { ... }
```

### `src/components/sci/modals/SciExportModal.jsx`
- Modal con:
  - Selector formato (5 radios con iconos)
  - Selector alcance (5 radios + input rango fecha)
  - Preview de conteo: "X entradas serán exportadas"
  - Botón "Descargar"
- Estilo: mismo patrón que `SciAutoScenarioModal`
- Dispara `exportLog()` al confirmar

## 1.3 Archivos modificados

### `src/components/sci/panels/SciTopBar.jsx`
- Añadir botón `↓ Export` entre "Escenarios" y "↺"
- onClick → abre `SciExportModal`
- Estado modal en `SciModeRoot.jsx`

### `src/components/sci/panels/SciSidebar.jsx` (tab Registro)
- Botón flotante "Exportar" en esquina superior derecha de la tab

### `src/components/sci/SciModeRoot.jsx`
- Añadir `useState` + render condicional de `SciExportModal`

## 1.4 Formato de entrada del log (referencia)
```js
// sci.eventLog[i] estructura actual
{
  t: 1716745387123,        // ms epoch
  level: 'critical' | 'dispatch' | 'info' | 'arrival',
  msg: '🏚️ Colapso reportado...',
}
```

**Necesario añadir** al dispatch de `SCI_LOG_EVENT` (sin romper compat):
- `incidentId`: si aplica (string ID formal)
- `opId`: período operacional activo
- `by`: rol que reporta (ej. 'C5' | 'IC' | 'OSC' | 'sim')

Actualizar `appReducer.js` action `SCI_LOG_EVENT` para aceptar campos opcionales.

## 1.5 Formato exportado (ejemplo CSV)
```csv
timestamp_iso,timestamp_local,level,incident_id,op_id,by,message
2026-05-26T20:23:07Z,2026-05-26 14:23:07,CRITICAL,INC-2026-0526-0001,OP-1,C5,Colapso reportado — Narvarte
```

## 1.6 PDF ICS-214 (preview)
```
┌────────────────────────────────────────────┐
│  ICS-214 — REGISTRO DE ACTIVIDAD           │
│  Incidente: INC-2026-0526-0001             │
│  OP: 1   IC: Cmte. R. González             │
│  Fecha: 2026-05-26 14:23 (CDMX)            │
├────────────────────────────────────────────┤
│  Hora    │ Por  │ Acción                   │
│  14:00:00│ C5   │ Sismo M7.5 detectado     │
│  14:00:08│ IC   │ Plan DN-III activado     │
│  ...                                        │
└────────────────────────────────────────────┘
```

---

# FASE 2 · Pulido visual · seriedad institucional

## 2.1 Topbar institucional

### `src/components/sci/panels/SciTopBar.jsx` — rediseño
Layout final (izq → der):
```
[● UTC 14:23:07Z] | [OP-1 ▾] | [IC: González ▾] | [En vivo|Simular] | [×1 ×2 ×3] | [⏸] | + Inc | + Zona ▾ | 🎬 Escenarios | ↓ Export | ↺
```

- Reloj UTC actualizando 1s — componente `<UtcClock />`
- Click en reloj toggle UTC ↔ local
- OP dropdown: muestra OP actual, opción "Cerrar OP / Abrir OP-N+1"
- IC dropdown: muestra IC asignado, opción "Cambiar IC"

## 2.2 Componente `UtcClock`

### `src/components/sci/panels/SciUtcClock.jsx`
- `setInterval(1000)` actualizando estado
- Formato UTC: `14:23:07Z`
- Formato local: `08:23:07 CDMX`
- Color: slate-300 fijo, mono font

## 2.3 Paleta institucional

### `tailwind.config.js`
```js
extend: {
  colors: {
    ops: {
      crit:  '#dc2626',  // FEMA red
      warn:  '#d97706',  // amber
      ok:    '#059669',  // green
      info:  '#2563eb',  // blue
    },
  },
}
```

Reemplazar uso de `red-500/600`, `amber-400/500`, `emerald-500`, `blue-500` por estos en componentes SCI.

## 2.4 Logs sin emojis decorativos

### `src/components/sci/panels/SciSidebar.jsx` (RegistroTab)
Reemplazar emojis por badges tipográficos:
```
[14:23:07Z]  [CRIT]  INC-2026-0526-0001  Colapso reportado — Narvarte
[14:23:08Z]  [DSP]   INC-2026-0526-0001  ERUM-003 despachada · ETA 1m24s
[14:23:42Z]  [INFO]  —                   Patrulla SSC-12 reposicionada
[14:24:01Z]  [ARR]   INC-2026-0526-0001  ERUM-003 en escena
```

Badge styles (todos `font-mono text-[9px] px-1 rounded`):
- `[CRIT]` rojo (`bg-red-950/60 text-red-300`)
- `[DSP]`  ámbar
- `[INFO]` slate
- `[ARR]`  verde

## 2.5 Numeración formal

### `src/utils/idGen.js` (nuevo)
```js
// INC-YYYY-MMDD-NNNN  · counter persiste en localStorage por sesión
export function nextIncidentId(date = new Date()) { ... }
export function nextDispatchId(date = new Date()) { ... }
export function nextOpId() { ... }
```

### `src/context/appReducer.js`
- En `SCI_COMMIT_INCIDENT`: ignorar `clave` que viene del payload, generar con `nextIncidentId()`
- En `SCI_ASSIGN_RESOURCE`: añadir `dispatchId` al payload generado por reducer
- Migrar incidentes existentes en estado → no, eliminar storage previo en `SCI_RESET`

### `src/constants/sciAutoScenarios.js`
- Eliminar campo `clave` de cada evento (lo genera el reducer)

## 2.6 Tipografía consistente

Verificar uso en componentes SCI:
- `font-mono`: claves, IDs, ETAs, coords, timestamps, badges
- `font-sans` (Inter, default): labels, descripciones, párrafos
- `font-display` (Space Grotesk): solo headers de modal/panel

Pasada manual de revisión:
- `SciIncidentPanel.jsx`
- `SciUnitDetailPanel.jsx`
- `SciSidebar.jsx`
- `SciTopBar.jsx`
- `SciAutoScenarioModal.jsx`

## 2.7 Pulses más sutiles

### `src/index.css`
- `.sci-incident-pulse--1/2` → opacidad máx 0.3 (estaba 0.5)
- `.sci-unit-ring` → opacidad 0.5 (estaba 0.65)
- `.linc-ring` → opacidad 0.5

---

# FASE 3 · Estructura de mando ICS

## 3.1 Constantes nuevas

### `src/constants/icsRoles.js`
```js
export const ICS_ROLES = {
  IC:  { code: 'IC',  label: 'Comandante de Incidente',  short: 'IC',  level: 1 },
  SO:  { code: 'SO',  label: 'Oficial de Seguridad',     short: 'SO',  level: 2 },
  PIO: { code: 'PIO', label: 'Oficial de Información',   short: 'PIO', level: 2 },
  LO:  { code: 'LO',  label: 'Oficial de Enlace',        short: 'LO',  level: 2 },
  OSC: { code: 'OSC', label: 'Jefe de Operaciones',      short: 'OSC', level: 3 },
  PSC: { code: 'PSC', label: 'Jefe de Planeación',       short: 'PSC', level: 3 },
  LSC: { code: 'LSC', label: 'Jefe de Logística',        short: 'LSC', level: 3 },
  FSC: { code: 'FSC', label: 'Jefe de Finanzas/Admin',   short: 'FSC', level: 3 },
}
export const ICS_ROLE_KEYS = Object.keys(ICS_ROLES)
```

### `src/constants/icsMockPersonnel.js`
```js
// Personal mock para asignación rápida — nombres mexicanos plausibles
export const MOCK_PERSONNEL = [
  { id: 'p1',  name: 'Cmte. Rodrigo González Martínez', rank: 'Comandante', org: 'PC-CDMX' },
  { id: 'p2',  name: 'Tte. María Fernanda Cruz Lara',   rank: 'Teniente',   org: 'ERUM' },
  // ... ~20 entradas variadas (bomberos, SSC, SEDENA, Marina, PC, Cruz Roja)
]
```

### `src/constants/esfFunctions.js`
```js
export const ESF = {
  'ESF-1':  { label: 'Transporte',                    color: '#64748b' },
  'ESF-2':  { label: 'Comunicaciones',                color: '#0ea5e9' },
  'ESF-3':  { label: 'Obras Públicas',                color: '#737373' },
  'ESF-4':  { label: 'Bomberos',                      color: '#dc2626' },
  'ESF-5':  { label: 'Gestión de Emergencia',         color: '#7c3aed' },
  'ESF-6':  { label: 'Albergues y Servicios Masivos', color: '#06b6d4' },
  'ESF-7':  { label: 'Logística',                     color: '#a78bfa' },
  'ESF-8':  { label: 'Salud y Médico',                color: '#16a34a' },
  'ESF-9':  { label: 'Búsqueda y Rescate',            color: '#f59e0b' },
  'ESF-10': { label: 'HAZMAT',                        color: '#eab308' },
  'ESF-11': { label: 'Recursos Agrícolas',            color: '#65a30d' },
  'ESF-12': { label: 'Energía',                       color: '#facc15' },
  'ESF-13': { label: 'Seguridad Pública',             color: '#2563eb' },
  'ESF-14': { label: 'Recuperación a Largo Plazo',    color: '#94a3b8' },
  'ESF-15': { label: 'Asuntos Externos',              color: '#f472b6' },
}
```

### `src/constants/nimsResourceTyping.js`
```js
// Mapping typeCode → NIMS Type (I-IV, I = máxima capacidad)
export const NIMS_TYPE = {
  'ambulancia-intensiva': 'I',
  'ambulancia-basica':    'III',
  'rescate-erum':         'I',
  'rescate-bomberos':     'II',
  'pipa-bomberos':        'II',
  'patrulla-ssc':         'III',
  'k9-ssc':               'II',
  'pc-busqueda-rescate':  'I',
  'pc-evaluacion':        'I',
  'cruzroja-intensiva':   'I',
  'cruzroja-basica':      'III',
  'convoy-sedena':        'I',
  'ingenieros-sedena':    'I',
  'marina-refuerzo':      'I',
  'helicoptero-condor':   'I',
  'helicoptero-marina':   'I',
  'hospital-3er-nivel':   'I',
  'hospital-2do-nivel':   'II',
}
```

### `src/constants/sciStatusCodes.js`
```js
// ICS / 10-codes mapping
export const STATUS_CODES = {
  disponible:      { code: '10-8',    en: 'available',      es: 'Disponible'    },
  asignado:        { code: '10-7',    en: 'assigned',       es: 'Asignado'      },
  enroute:         { code: '10-76',   en: 'en route',       es: 'En tránsito'   },
  'on-scene':      { code: '10-23',   en: 'on scene',       es: 'En escena'     },
  'no-disponible': { code: '10-7-OS', en: 'out of service', es: 'No disponible' },
}
```

## 3.2 Estado nuevo

### `src/context/appReducer.js` initialSciState
```js
sci: {
  ...existente,
  command: {
    IC:  null,   // { personnelId, since: ms }
    SO:  null,
    PIO: null,
    LO:  null,
    OSC: null,
    PSC: null,
    LSC: null,
    FSC: null,
  },
  operationalPeriods: [],   // [{ id, label, start, end, IC, status: 'active'|'closed' }]
  activeOpId: null,
}
```

### Actions nuevas
```js
SCI_ASSIGN_ROLE      { role, personnelId }
SCI_UNASSIGN_ROLE    { role }
SCI_OPEN_OP          { label }   // genera id, set start, set activeOpId
SCI_CLOSE_OP         { id }      // set end + status closed
```

## 3.3 UI nueva

### `src/components/sci/panels/SciCommandPanel.jsx`
- Collapsible card encima del sidebar (o pestaña nueva)
- Lista 8 roles ICS con dropdown personal
- Visual: nombre + rango + org

### `src/components/sci/panels/SciOpBadge.jsx`
- Chip pequeño en topbar mostrando OP activo
- Dropdown con botones "Cerrar OP" + "Abrir OP-N+1"
- Tiempo restante / transcurrido del OP

## 3.4 Modificaciones

### `src/components/sci/panels/SciSidebar.jsx` (ResourcesTab)
- Junto a cada unidad, badge `[T-I]` etc. con color por tipo
- Tooltip muestra código radial (`10-8`)

### `src/components/sci/panels/SciIncidentPanel.jsx`
- Badge ESF en header (1-3 ESF aplicables, color del ESF)
- Footer: línea pequeña con IC actual asignado al incidente

### `src/components/sci/panels/SciUnitDetailPanel.jsx`
- Línea nueva en bloque Estado: `Código: 10-8` (en font-mono pequeña)
- Badge NIMS Type junto al estado

---

# FASE 4 · Formularios ICS

## 4.1 Archivos nuevos

### `src/utils/icsForms/ics214.js` — Activity Log
```js
import { buildPDF } from '../format/pdf.js'
export function generateICS214(incident, log, command, op) {
  return buildPDF({
    title: 'ICS-214 — REGISTRO DE ACTIVIDAD',
    subtitle: `Incidente: ${incident.id}   OP: ${op.label}   IC: ${command.IC?.name ?? '—'}`,
    tableRows: log.map(e => [fmtTime(e.t), e.by ?? '—', e.msg]),
  })
}
```

### `src/utils/icsForms/ics201.js` — Incident Briefing
- Sección "Situación actual": campos del incidente
- Sección "Recursos asignados": tabla de unidades
- Sección "Acciones": últimas 10 del log
- Sección "Próximas acciones": placeholder editable (futuro)

### `src/utils/icsForms/ics209.js` — Status Summary
- Resumen agregado: total víctimas, recursos comprometidos, % contención
- Lista de incidentes activos
- Top 5 eventos críticos del OP

### `src/utils/icsForms/ics211.js` — Check-In
- Tabla de unidades con: timestamp check-in, ID, dependencia, asignación, IC reportante

## 4.2 UI

### `src/components/sci/modals/SciFormsModal.jsx`
- Selector formulario (4 botones grandes con descripción)
- Selector alcance (incidente actual / OP / global)
- Preview de campos
- Botón "Generar PDF"

### Botones de acceso
- `SciTopBar`: botón `📋 Formularios` (mismo bloque que Export)
- `SciIncidentPanel`: botón "ICS-201" en footer (genera briefing del incidente activo)

## 4.3 Log auto-poblado (check-in 211)

### `src/hooks/useSciSimulation.js`
- Al dispatch `SCI_ASSIGN_RESOURCE`, también log entrada `by: 'OSC'` con `level: 'dispatch'`
- Al arrival, log `by: unit.id` con `level: 'arrival'` — extender para incluir en ICS-211

---

# FASE 5 · Datos correctos · ajustes información

## 5.1 Dependencias completas

### `src/constants/sciDependencies.js`
Añadir (verificar que no rompa unidades existentes):
```js
'C5-CDMX':  { label: 'C5',     fullName: 'Centro de Comando y Control CDMX', color: '#1e40af', icon: '📡' },
'CRUM':     { label: 'CRUM',   fullName: 'Centro Regulador de Urgencias Médicas', color: '#dc2626', icon: '🚨' },
'SEMOVI':   { label: 'SEMOVI', fullName: 'Secretaría de Movilidad CDMX', color: '#0891b2', icon: '🚦' },
'CFE':      { label: 'CFE',    fullName: 'Comisión Federal de Electricidad', color: '#facc15', icon: '⚡' },
'SACMEX':   { label: 'SACMEX', fullName: 'Sistema de Aguas CDMX', color: '#0ea5e9', icon: '💧' },
'PEMEX':    { label: 'PEMEX',  fullName: 'Petróleos Mexicanos', color: '#16a34a', icon: '⛽' },
```

## 5.2 Tipos de incidente nuevos

### `src/constants/sciIncidentTypes.js`
Añadir:
- `tsunami`: cascada post-sismo (requiere: Marina, PC, SEDENA)
- `falla-electrica`: corte masivo (requiere: CFE, SSC para semáforos)
- `hundimiento`: subsidencia CDMX (requiere: PC, SACMEX, ingenieros)
- `inundacion-pluvial`: lluvia extrema (requiere: PC, SACMEX, Bomberos)
- `disturbio`: manifestación violenta (requiere: SSC, ERUM, Cruz Roja)

Cada uno con:
- `requiredResponders: []`
- `defaultZones: { red, yellow, green }`
- `esfTags: ['ESF-X', ...]`

## 5.3 Campos más realistas

### `src/constants/sciIncidentTypes.js` extended schema
```js
sismo: {
  ...existente,
  fieldsSchema: [
    { key: 'magnitud',           label: 'Magnitud (Mw)',         type: 'number' },
    { key: 'profundidad',        label: 'Profundidad (km)',      type: 'number' },
    { key: 'intensidadMercalli', label: 'Intensidad Mercalli',   type: 'string' },
    { key: 'tsunami',            label: 'Riesgo tsunami',        type: 'bool'   },
    { key: 'replicas',           label: 'Réplicas reportadas',   type: 'number' },
  ],
}
```

### `src/components/sci/panels/SciIncidentPanel.jsx` FIELD_LABELS
Ampliar mapeo legible para todos los nuevos campos.

## 5.4 ETA realista

### `src/utils/etaModel.js` (nuevo)
```js
// Factor de hora pico CDMX
function trafficMultiplier(hourLocal) {
  if (hourLocal >= 7 && hourLocal <= 10)  return 1.8
  if (hourLocal >= 17 && hourLocal <= 21) return 1.7
  if (hourLocal >= 14 && hourLocal <= 16) return 1.3
  return 1.0
}

// Factor por tipo de unidad
const TORTUOSITY = {
  default: 1.3,
  'helicoptero-condor': 1.0,
  'helicoptero-marina': 1.0,
}

export function estimateETA(resource, fromLat, fromLng, toLat, toLng, now = Date.now()) {
  const dx = (toLng - fromLng) * 111320 * Math.cos(toLat * Math.PI / 180)
  const dy = (toLat - fromLat) * 110540
  const distMeters = Math.sqrt(dx*dx + dy*dy)

  const speedMs = SPEED_MS[resource.typeCode] ?? 14   // ~50 km/h default
  const hour = new Date(now).getHours()
  const traffic = trafficMultiplier(hour)
  const tort = TORTUOSITY[resource.typeCode] ?? TORTUOSITY.default

  return Math.round((distMeters / speedMs) * traffic * tort * 1000)  // ms
}

export function fmtETA(ms) {
  const s = Math.round(ms / 1000)
  if (s <= 600) {                     // ≤ 10 min: m:ss
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  }
  // > 10 min: ETA absoluta HH:MM
  const arrival = new Date(Date.now() + ms)
  return `~${arrival.getHours()}:${String(arrival.getMinutes()).padStart(2,'0')}`
}
```

### Migrar usos
- `src/hooks/useSciSimulation.js`: reemplazar cálculo ETA por `estimateETA()`
- Reemplazar formatos `${Math.round(eta/1000)}s` por `fmtETA(eta)` en:
  - `SciSidebar.jsx` (ResourcesTab, IncidentsTab)
  - `SciUnitDetailPanel.jsx`
  - `SciIncidentPanel.jsx`

## 5.5 Hospitales con capacidad

### `src/constants/cdmxHospitals.js` (verificar existente, extender)
Cada hospital:
```js
{
  id, nombre, lat, lng,
  nivel: 3,                    // I/II/III
  especialidad: ['trauma', 'quemados', 'pediatrico'],
  camas: { total: 300, disponibles: 87 },
  quirofanos: 8,
  helipuerto: true,
}
```

### `SciUnitDetailPanel.jsx`
Para tipos hospital: añadir bloque "Capacidad" mostrando camas/quirófanos.

## 5.6 ACV con capacidad

### Reducer: `SCI_ADD_ZONE` payload acepta `capacity`
- ACV: capacidad default 50 víctimas
- Triage: capacidad default 30
- Helipuerto: 1 helo a la vez
Display en tooltip de zona.

---

# Backlog / out-of-scope (no en este ciclo)

- Multiplayer / colaboración tiempo real
- Persistencia backend (todo es sesión actual)
- Replay completo de OP cerrado
- Notificaciones push reales
- Integración FCM/CAD/911

---

# Notas de ejecución

- **Cada fase = 1 sesión** salvo Fase 3 (puede ser 2)
- **Commits por fase** — no mezclar fases
- **Validar `npm run build`** al cerrar cada fase
- **No tocar `gap` mode** — todo cambio aislado a SCI
- **Mantener `caveman mode`** en respuestas al usuario
- **Plan vivo:** actualizar este doc si decisiones cambian
