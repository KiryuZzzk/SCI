import { INCIDENT_TYPE_KEYS } from '../constants/incidentTypes.js'
import { SCI_DEPENDENCIES, dependencyColor } from '../constants/sciDependencies.js'
import { nextIncidentId, resetIdCounters } from '../utils/idGen.js'

// ───────────────────────── Initial state ─────────────────────────
const emptyByDependency = () =>
  Object.keys(SCI_DEPENDENCIES).reduce((acc, k) => { acc[k] = []; return acc }, {})

const initialSci = {
  mode: 'live',                // 'live' | 'auto'
  running: true,
  speed: 1,                    // 1 | 2 | 3
  creation: {
    step: 'idle',              // 'idle' | 'pick-point' | 'form' | 'zones'
    draft: null,               // { lat,lng,type,clave,fields,zones,parentId }
  },
  incidents: [],
  zones: [],                   // SCI especiales
  resources: {
    byId: {},
    allIds: [],
    byDependency: emptyByDependency(),
  },
  selectedResourceId: null,
  selectedIncidentId: null,
  uiFilters: {
    dependency: 'all',
    state: 'all',
    typeCode: 'all',
    proximityCenter: null,
    proximityRadiusKm: 5,
  },
  eventLog: [],
  autoTimeline: null,          // { name, events, startedAt, fired:[] }
  zoneCreator: null,           // { type, label, incidentId } activo
  resourceLoaded: false,
  // ICS Command structure
  command: {
    IC: null, SO: null, PIO: null, LO: null,
    OSC: null, PSC: null, LSC: null, FSC: null,
  },
  operationalPeriods: [],      // [{ id, label, start, end, status:'active'|'closed' }]
  activeOpId: null,
  // Checklist SCI por incidente — { [incidentId]: { [stepKey]: { done, at, manual } } }
  checklists: {},
}

export const initialState = {
  // App mode
  appMode: 'gap',              // 'gap' | 'sci'

  // Data
  colonias: null,
  alcaldias: null,
  incidents: null,
  hospitals: null,
  fireStations: null,
  metadata: null,

  // Filters (modo gap)
  activeTypes: [...INCIDENT_TYPE_KEYS],
  selectedAlcaldia: null,
  mapMode: 'gap',

  // UI (modo gap)
  selectedColonia: null,
  sidebarOpen: false,

  // Live simulation (modo gap)
  liveMode: false,
  liveSpeed: 1,

  // Simulator hipotético (modo gap)
  simulatorActive: false,
  hypothetical: [],

  // SCI slice
  sci: initialSci,
}

// ───────────────────────── Helpers ─────────────────────────
let _sciId = 1
const sciUid = () => _sciId++

function appendLog(log, level, msg, extra = {}) {
  return [{ t: Date.now(), level, msg, ...extra }, ...log].slice(0, 200)
}

function buildResource(raw) {
  const color = dependencyColor(raw.dependency)
  return {
    ...raw,
    color,
    mobile: raw.dependency !== 'HOSPITAL',
    lat: raw.baseLat,
    lng: raw.baseLng,
    heading: 0,
    waypoints: [],
    state: 'disponible',
    assignedIncidentId: null,
    eta: null,
  }
}

function indexResources(rawArray) {
  const byId = {}
  const allIds = []
  const byDependency = emptyByDependency()
  for (const raw of rawArray) {
    const r = buildResource(raw)
    byId[r.id] = r
    allIds.push(r.id)
    if (!byDependency[r.dependency]) byDependency[r.dependency] = []
    byDependency[r.dependency].push(r.id)
  }
  return { byId, allIds, byDependency }
}

// Convierte fire-stations.json + hospitals.json en Resource objects
function autoResourcesFromStaticData(state) {
  const extras = []
  if (state.fireStations) {
    state.fireStations.forEach((s, i) => {
      extras.push({
        id: `BMB-${String(i + 1).padStart(3, '0')}`,
        matricula: String(i + 1).padStart(3, '0'),
        dependency: 'BOMBEROS',
        typeCode: i % 5 === 0 ? 'pipa-bomberos' : 'rescate-bomberos',
        label: `${i % 5 === 0 ? 'Pipa Comb.' : 'Autobomba'} B-${String(i + 1).padStart(3, '0')}`,
        baseLat: s.lat,
        baseLng: s.lng,
      })
    })
  }
  if (state.hospitals && Array.isArray(state.hospitals)) {
    state.hospitals.forEach(h => {
      extras.push({
        id: h.id || `HOSP-${h.lat}-${h.lng}`,
        matricula: null,
        dependency: 'HOSPITAL',
        typeCode: h.nivel === 3 ? 'hospital-3er-nivel' : 'hospital-2do-nivel',
        label: h.nombre,
        baseLat: h.lat,
        baseLng: h.lng,
      })
    })
  }
  return extras
}

// ───────────────────────── Reducer ─────────────────────────
export function appReducer(state, action) {
  switch (action.type) {
    // ───── existing GAP actions (unchanged) ─────
    case 'DATA_LOADED':
      return { ...state, ...action.payload }

    case 'SET_ACTIVE_TYPES':
      return { ...state, activeTypes: action.payload }

    case 'TOGGLE_TYPE': {
      const key = action.payload
      const has = state.activeTypes.includes(key)
      const next = has
        ? state.activeTypes.filter(t => t !== key)
        : [...state.activeTypes, key]
      return { ...state, activeTypes: next.length ? next : state.activeTypes }
    }

    case 'SET_ALCALDIA':
      return { ...state, selectedAlcaldia: action.payload }

    case 'SET_MAP_MODE':
      return { ...state, mapMode: action.payload }

    case 'SELECT_COLONIA':
      return {
        ...state,
        selectedColonia: action.payload,
        sidebarOpen: action.payload !== null,
      }

    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false, selectedColonia: null }

    case 'TOGGLE_LIVE':
      return { ...state, liveMode: !state.liveMode }

    case 'SET_LIVE_SPEED':
      return { ...state, liveSpeed: action.payload }

    case 'TOGGLE_SIMULATOR':
      return {
        ...state,
        simulatorActive: !state.simulatorActive,
        hypothetical: state.simulatorActive ? [] : state.hypothetical,
      }

    case 'ADD_HYPOTHETICAL': {
      const newItem = { id: Date.now(), ...action.payload }
      return { ...state, hypothetical: [...state.hypothetical, newItem] }
    }

    case 'MOVE_HYPOTHETICAL':
      return {
        ...state,
        hypothetical: state.hypothetical.map(h =>
          h.id === action.payload.id ? { ...h, ...action.payload } : h
        ),
      }

    case 'REMOVE_HYPOTHETICAL':
      return {
        ...state,
        hypothetical: state.hypothetical.filter(h => h.id !== action.payload),
      }

    case 'RESET_SIMULATOR':
      return { ...state, hypothetical: [] }

    // ───── App mode toggle ─────
    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload }

    // ───── SCI: load resources ─────
    case 'SCI_LOAD_RESOURCES': {
      const sciJson = action.payload || []
      const merged = [...sciJson, ...autoResourcesFromStaticData(state)]
      const indexed = indexResources(merged)
      return {
        ...state,
        sci: {
          ...state.sci,
          resources: indexed,
          resourceLoaded: true,
          eventLog: appendLog(state.sci.eventLog, 'info', `Catálogo cargado: ${indexed.allIds.length} recursos`),
        },
      }
    }

    // ───── SCI: simple toggles ─────
    case 'SCI_SET_MODE':
      return { ...state, sci: { ...state.sci, mode: action.payload } }
    case 'SCI_SET_RUNNING':
      return { ...state, sci: { ...state.sci, running: action.payload } }
    case 'SCI_SET_SPEED':
      return { ...state, sci: { ...state.sci, speed: action.payload } }
    case 'SCI_SET_FILTERS':
      return { ...state, sci: { ...state.sci, uiFilters: { ...state.sci.uiFilters, ...action.payload } } }

    // ───── SCI: creation flow ─────
    case 'SCI_START_CREATION': {
      const parentId = action.payload?.parentId ?? null
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: { step: 'pick-point', draft: { parentId } },
          zoneCreator: null,
        },
      }
    }
    case 'SCI_SET_DRAFT_POINT':
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: {
            step: 'form',
            draft: { ...state.sci.creation.draft, lat: action.payload.lat, lng: action.payload.lng },
          },
        },
      }
    case 'SCI_SET_DRAFT_TYPE':
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: {
            ...state.sci.creation,
            draft: { ...state.sci.creation.draft, type: action.payload.type, fields: action.payload.fields, zones: action.payload.zones },
          },
        },
      }
    case 'SCI_SET_DRAFT_FIELDS':
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: { ...state.sci.creation, draft: { ...state.sci.creation.draft, fields: action.payload } },
        },
      }
    case 'SCI_SET_DRAFT_CLAVE':
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: { ...state.sci.creation, draft: { ...state.sci.creation.draft, clave: action.payload } },
        },
      }
    case 'SCI_SET_DRAFT_STEP':
      return {
        ...state,
        sci: { ...state.sci, creation: { ...state.sci.creation, step: action.payload } },
      }
    case 'SCI_SET_DRAFT_ZONES':
      return {
        ...state,
        sci: {
          ...state.sci,
          creation: { ...state.sci.creation, draft: { ...state.sci.creation.draft, zones: action.payload } },
        },
      }
    case 'SCI_CANCEL_CREATION':
      return { ...state, sci: { ...state.sci, creation: { step: 'idle', draft: null } } }

    case 'SCI_COMMIT_INCIDENT': {
      const draft = action.payload || state.sci.creation.draft
      if (!draft) return state
      const id = sciUid()
      const newInc = {
        id,
        clave: nextIncidentId(),
        type: draft.type,
        createdAt: Date.now(),
        lat: draft.lat,
        lng: draft.lng,
        fields: draft.fields || {},
        zones: draft.zones,
        parentId: draft.parentId ?? null,
        assignedUnitIds: [],
        status: 'active',
        log: [{ t: Date.now(), msg: 'Incidente creado' }],
      }
      return {
        ...state,
        sci: {
          ...state.sci,
          incidents: [...state.sci.incidents, newInc],
          creation: { step: 'idle', draft: null },
          selectedIncidentId: id,
          eventLog: appendLog(state.sci.eventLog, 'critical', `Nuevo incidente ${newInc.clave} (${newInc.type})`),
        },
      }
    }

    case 'SCI_UPDATE_INCIDENT_ZONES':
      return {
        ...state,
        sci: {
          ...state.sci,
          incidents: state.sci.incidents.map(i =>
            i.id === action.payload.id ? { ...i, zones: action.payload.zones } : i
          ),
        },
      }

    case 'SCI_CLOSE_INCIDENT': {
      const id = action.payload
      // Free assigned units (will return to base via SCI_TICK)
      const inc = state.sci.incidents.find(i => i.id === id)
      const freed = inc ? inc.assignedUnitIds : []
      const byId = { ...state.sci.resources.byId }
      freed.forEach(rid => {
        const r = byId[rid]
        if (r) byId[rid] = { ...r, assignedIncidentId: null, state: 'disponible', waypoints: [], eta: null }
      })
      return {
        ...state,
        sci: {
          ...state.sci,
          incidents: state.sci.incidents.map(i => i.id === id ? { ...i, status: 'closed' } : i),
          resources: { ...state.sci.resources, byId },
          eventLog: appendLog(state.sci.eventLog, 'info', `Incidente ${inc?.clave ?? id} cerrado`),
        },
      }
    }

    case 'SCI_SELECT_INCIDENT':
      return { ...state, sci: { ...state.sci, selectedIncidentId: action.payload, selectedResourceId: null } }

    case 'SCI_SELECT_RESOURCE':
      return { ...state, sci: { ...state.sci, selectedResourceId: action.payload } }

    // ───── SCI: assignment ─────
    case 'SCI_ASSIGN_RESOURCE': {
      const { resourceId, incidentId, waypoints, eta } = action.payload
      const r = state.sci.resources.byId[resourceId]
      const inc = state.sci.incidents.find(i => i.id === incidentId)
      if (!r || !inc) return state
      const updatedR = {
        ...r,
        state: 'asignado',
        assignedIncidentId: incidentId,
        waypoints,
        eta,
      }
      return {
        ...state,
        sci: {
          ...state.sci,
          resources: {
            ...state.sci.resources,
            byId: { ...state.sci.resources.byId, [resourceId]: updatedR },
          },
          incidents: state.sci.incidents.map(i =>
            i.id === incidentId
              ? { ...i, assignedUnitIds: [...i.assignedUnitIds, resourceId], log: [...i.log, { t: Date.now(), msg: `${r.label} asignada` }] }
              : i
          ),
          eventLog: appendLog(state.sci.eventLog, 'dispatch', `${r.label} salió de base hacia ${inc.clave}`),
        },
      }
    }

    case 'SCI_UNASSIGN_RESOURCE': {
      const { resourceId } = action.payload
      const r = state.sci.resources.byId[resourceId]
      if (!r) return state
      const incidentId = r.assignedIncidentId
      const updatedR = { ...r, state: 'disponible', assignedIncidentId: null, waypoints: [], eta: null }
      return {
        ...state,
        sci: {
          ...state.sci,
          resources: {
            ...state.sci.resources,
            byId: { ...state.sci.resources.byId, [resourceId]: updatedR },
          },
          incidents: state.sci.incidents.map(i =>
            i.id === incidentId
              ? { ...i, assignedUnitIds: i.assignedUnitIds.filter(id => id !== resourceId) }
              : i
          ),
          eventLog: appendLog(state.sci.eventLog, 'info', `${r.label} liberada → regresa a base`),
        },
      }
    }

    case 'SCI_SET_RESOURCE_STATE': {
      const { resourceId, state: newState } = action.payload
      const r = state.sci.resources.byId[resourceId]
      if (!r) return state
      return {
        ...state,
        sci: {
          ...state.sci,
          resources: {
            ...state.sci.resources,
            byId: { ...state.sci.resources.byId, [resourceId]: { ...r, state: newState } },
          },
        },
      }
    }

    // Tick batch (from useSciSimulation)
    case 'SCI_TICK': {
      const { updates, arrivals, eventLog: newEvents } = action.payload
      const byId = { ...state.sci.resources.byId }
      updates.forEach(u => {
        const r = byId[u.id]
        if (r) byId[u.id] = { ...r, ...u }
      })
      let log = state.sci.eventLog
      newEvents.forEach(e => {
        const { level, msg, incidentId, opId, by } = e
        log = appendLog(log, level, msg, {
          ...(incidentId ? { incidentId } : {}),
          ...(opId       ? { opId }       : {}),
          ...(by         ? { by }         : {}),
        })
      })

      // Mark arrivals on incident logs
      let incidents = state.sci.incidents
      if (arrivals.length) {
        incidents = incidents.map(i => {
          const arr = arrivals.filter(a => a.incidentId === i.id)
          if (arr.length === 0) return i
          return {
            ...i,
            log: [
              ...i.log,
              ...arr.map(a => ({ t: Date.now(), msg: `${a.label} arribó al sitio` })),
            ],
          }
        })
      }
      return {
        ...state,
        sci: {
          ...state.sci,
          resources: { ...state.sci.resources, byId },
          incidents,
          eventLog: log,
        },
      }
    }

    case 'SCI_LOG_EVENT': {
      const { level, msg, incidentId, opId, by } = action.payload
      return {
        ...state,
        sci: {
          ...state.sci,
          eventLog: appendLog(state.sci.eventLog, level, msg, {
            ...(incidentId ? { incidentId } : {}),
            ...(opId       ? { opId }       : {}),
            ...(by         ? { by }         : {}),
          }),
        },
      }
    }

    // ───── SCI: special zones ─────
    case 'SCI_START_ZONE_CREATION':
      return { ...state, sci: { ...state.sci, zoneCreator: { ...action.payload, awaitingPoint: true } } }
    case 'SCI_CANCEL_ZONE_CREATION':
      return { ...state, sci: { ...state.sci, zoneCreator: null } }

    case 'SCI_ADD_ZONE': {
      const z = { id: sciUid(), ...action.payload }
      return {
        ...state,
        sci: {
          ...state.sci,
          zones: [...state.sci.zones, z],
          zoneCreator: null,
          eventLog: appendLog(state.sci.eventLog, 'info', `Zona ${z.type} creada`),
        },
      }
    }

    case 'SCI_REMOVE_ZONE':
      return { ...state, sci: { ...state.sci, zones: state.sci.zones.filter(z => z.id !== action.payload) } }

    // ───── SCI: auto scenario ─────
    case 'SCI_LOAD_AUTO_SCENARIO':
      return {
        ...state,
        sci: {
          ...state.sci,
          mode: 'auto',
          autoTimeline: { ...action.payload, startedAt: Date.now(), fired: [] },
          eventLog: appendLog(state.sci.eventLog, 'info', `Escenario "${action.payload.name}" cargado`),
        },
      }

    case 'SCI_MARK_TIMELINE_FIRED':
      return {
        ...state,
        sci: state.sci.autoTimeline
          ? { ...state.sci, autoTimeline: { ...state.sci.autoTimeline, fired: [...state.sci.autoTimeline.fired, action.payload] } }
          : state.sci,
      }

    case 'SCI_RESET': {
      // Devuelve recursos a base, limpia incidentes/zonas/timeline
      resetIdCounters()
      const byId = { ...state.sci.resources.byId }
      Object.keys(byId).forEach(id => {
        const r = byId[id]
        byId[id] = { ...r, lat: r.baseLat, lng: r.baseLng, heading: 0, waypoints: [], state: 'disponible', assignedIncidentId: null, eta: null }
      })
      return {
        ...state,
        sci: {
          ...state.sci,
          incidents: [],
          zones: [],
          autoTimeline: null,
          selectedIncidentId: null,
          selectedResourceId: null,
          creation: { step: 'idle', draft: null },
          zoneCreator: null,
          eventLog: appendLog(state.sci.eventLog, 'info', 'Escenario reiniciado'),
          resources: { ...state.sci.resources, byId },
        },
      }
    }

    // ───── ICS Command structure ─────
    case 'SCI_ASSIGN_ROLE': {
      const { role, personnelId } = action.payload
      return {
        ...state,
        sci: {
          ...state.sci,
          command: { ...state.sci.command, [role]: { personnelId, since: Date.now() } },
          eventLog: appendLog(state.sci.eventLog, 'info', `${role} asignado`, { by: 'IC' }),
        },
      }
    }

    case 'SCI_UNASSIGN_ROLE': {
      const { role } = action.payload
      return {
        ...state,
        sci: {
          ...state.sci,
          command: { ...state.sci.command, [role]: null },
        },
      }
    }

    // ───── Operational Periods ─────
    case 'SCI_OPEN_OP': {
      const { nextOpId } = action.payload
      const op = { id: nextOpId, label: nextOpId, start: Date.now(), end: null, status: 'active' }
      return {
        ...state,
        sci: {
          ...state.sci,
          operationalPeriods: [...state.sci.operationalPeriods, op],
          activeOpId: op.id,
          eventLog: appendLog(state.sci.eventLog, 'info', `${op.label} iniciado`, { opId: op.id }),
        },
      }
    }

    case 'SCI_CLOSE_OP': {
      const { id } = action.payload
      return {
        ...state,
        sci: {
          ...state.sci,
          operationalPeriods: state.sci.operationalPeriods.map(op =>
            op.id === id ? { ...op, end: Date.now(), status: 'closed' } : op
          ),
          activeOpId: null,
          eventLog: appendLog(state.sci.eventLog, 'info', `${id} cerrado`, { opId: id }),
        },
      }
    }

    // ───── Persistencia: restaurar slice sci completo ─────
    case 'SCI_RESTORE': {
      const restored = action.payload || {}
      // Re-indexa recursos si vienen como objeto plano (mantiene byDependency)
      let resources = restored.resources
      if (resources && (!resources.byDependency || !resources.allIds)) {
        const flat = resources.byId ? Object.values(resources.byId) : []
        resources = indexResources(flat.map(r => ({ ...r, baseLat: r.baseLat ?? r.lat, baseLng: r.baseLng ?? r.lng })))
        // preserva estado dinámico (no reconstruir desde base)
        const orig = restored.resources.byId
        Object.keys(orig).forEach(id => { if (resources.byId[id]) resources.byId[id] = orig[id] })
      }
      return {
        ...state,
        sci: {
          ...state.sci,
          ...restored,
          resources: resources ?? state.sci.resources,
          resourceLoaded: true,
          // estado UI efímero siempre limpio al restaurar
          creation: { step: 'idle', draft: null },
          zoneCreator: null,
          autoTimeline: null,
          selectedIncidentId: null,
          selectedResourceId: null,
          checklists: restored.checklists ?? {},
          eventLog: appendLog(restored.eventLog ?? state.sci.eventLog, 'info', 'Escenario restaurado'),
        },
      }
    }

    // ───── Checklist SCI ─────
    case 'SCI_CHECKLIST_TOGGLE': {
      const { incidentId, stepKey } = action.payload
      const incChecks = state.sci.checklists[incidentId] ?? {}
      const cur = incChecks[stepKey]
      const next = cur?.done
        ? { ...cur, done: false }
        : { done: true, at: Date.now(), manual: true }
      return {
        ...state,
        sci: {
          ...state.sci,
          checklists: {
            ...state.sci.checklists,
            [incidentId]: { ...incChecks, [stepKey]: next },
          },
        },
      }
    }

    case 'SCI_CHECKLIST_NOTE': {
      const { incidentId, stepKey, note } = action.payload
      const incChecks = state.sci.checklists[incidentId] ?? {}
      return {
        ...state,
        sci: {
          ...state.sci,
          checklists: {
            ...state.sci.checklists,
            [incidentId]: {
              ...incChecks,
              [stepKey]: { ...(incChecks[stepKey] ?? {}), note },
            },
          },
        },
      }
    }

    default:
      return state
  }
}
