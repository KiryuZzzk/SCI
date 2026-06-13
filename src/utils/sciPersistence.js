/**
 * Persistencia del estado SCI sin backend.
 *
 *  - Autosave debounced del slice `sci` a localStorage (sobrevive recarga)
 *  - Snapshots nombrados (guardar/cargar escenarios completos)
 *  - Export / import JSON (compartir entre instancias)
 *
 * NO persiste la data geográfica (colonias/alcaldías/hospitales) — esa
 * se recarga de archivos estáticos al boot. Solo el estado operativo SCI.
 */

const AUTOSAVE_KEY = 'sci_autosave_v1'
const SNAPSHOTS_KEY = 'sci_snapshots_v1'
const SCHEMA_VERSION = 1

// ── Campos del slice sci que SÍ persistimos ─────────────────────────
// Excluimos `resourceLoaded` (se recalcula) pero mantenemos resources
// porque el usuario puede haberlos modificado (estados, asignaciones).
const PERSIST_FIELDS = [
  'mode', 'speed', 'incidents', 'zones', 'resources',
  'eventLog', 'command', 'operationalPeriods', 'activeOpId',
  'checklists', 'uiFilters',
]

function pickPersistable(sci) {
  const out = {}
  for (const k of PERSIST_FIELDS) {
    if (sci[k] !== undefined) out[k] = sci[k]
  }
  return out
}

// ── Autosave ────────────────────────────────────────────────────────
let _saveTimer = null

/**
 * Guarda el estado SCI con debounce (default 800ms).
 * Llamar en cada cambio; solo escribe tras pausa.
 */
export function autosaveSci(sci, delay = 800) {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      const payload = {
        version: SCHEMA_VERSION,
        savedAt: Date.now(),
        sci: pickPersistable(sci),
      }
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.warn('[sciPersistence] autosave falló:', err)
    }
  }, delay)
}

/** Lee el autosave. Devuelve { sci, savedAt } o null. */
export function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== SCHEMA_VERSION) return null
    if (!parsed.sci || !Array.isArray(parsed.sci.incidents)) return null
    return { sci: parsed.sci, savedAt: parsed.savedAt }
  } catch (err) {
    console.warn('[sciPersistence] loadAutosave falló:', err)
    return null
  }
}

export function clearAutosave() {
  try { localStorage.removeItem(AUTOSAVE_KEY) } catch { /* noop */ }
}

// ── Snapshots nombrados ─────────────────────────────────────────────
function readSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSnapshots(list) {
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(list))
    return true
  } catch (err) {
    console.warn('[sciPersistence] writeSnapshots falló:', err)
    return false
  }
}

/** Lista metadata de snapshots (sin el payload pesado). */
export function listSnapshots() {
  return readSnapshots()
    .map(s => ({
      id: s.id,
      name: s.name,
      savedAt: s.savedAt,
      incidentCount: s.sci?.incidents?.length ?? 0,
      resourceCount: s.sci?.resources?.allIds?.length ?? 0,
    }))
    .sort((a, b) => b.savedAt - a.savedAt)
}

/** Guarda snapshot nombrado. Devuelve el id. */
export function saveSnapshot(name, sci) {
  const list = readSnapshots()
  const id = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const entry = {
    id,
    name: (name || 'Escenario sin nombre').trim().slice(0, 60),
    savedAt: Date.now(),
    version: SCHEMA_VERSION,
    sci: pickPersistable(sci),
  }
  list.push(entry)
  // Cap a 20 snapshots — descarta el más viejo
  while (list.length > 20) {
    list.sort((a, b) => a.savedAt - b.savedAt)
    list.shift()
  }
  writeSnapshots(list)
  return id
}

/** Carga el payload completo de un snapshot. Devuelve sci o null. */
export function loadSnapshot(id) {
  const entry = readSnapshots().find(s => s.id === id)
  if (!entry || entry.version !== SCHEMA_VERSION) return null
  return entry.sci
}

export function deleteSnapshot(id) {
  const list = readSnapshots().filter(s => s.id !== id)
  return writeSnapshots(list)
}

// ── Export / Import JSON ────────────────────────────────────────────
/** Devuelve un Blob descargable con el estado SCI actual. */
export function exportSciBlob(sci, meta = {}) {
  const payload = {
    app: 'CoberturaECMX',
    kind: 'sci-scenario',
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    ...meta,
    sci: pickPersistable(sci),
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

/**
 * Parsea texto JSON importado. Lanza Error con mensaje claro si inválido.
 * @returns {object} slice sci listo para SCI_RESTORE
 */
export function parseSciImport(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Archivo no es JSON válido')
  }
  if (parsed.kind !== 'sci-scenario' && !parsed.sci) {
    throw new Error('No es un escenario SCI de CoberturaECMX')
  }
  const sci = parsed.sci ?? parsed
  if (!Array.isArray(sci.incidents)) {
    throw new Error('Escenario corrupto: faltan incidentes')
  }
  return sci
}
