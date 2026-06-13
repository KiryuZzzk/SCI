import { useEffect, useRef } from 'react'
import { streetRoute } from '../utils/streetRoute.js'
import { SCI_INCIDENT_TYPES } from '../constants/sciIncidentTypes.js'
import { SCI_DEPENDENCIES } from '../constants/sciDependencies.js'
import { fmtEta } from '../utils/etaModel.js'

// ── Velocidades por typeCode (grados/segundo) ──────────────────
const SPEED_BY_TYPE = {
  'ambulancia-basica':    0.0011,
  'ambulancia-intensiva': 0.0012,
  'rescate-erum':         0.0010,
  'patrulla-ssc':         0.0014,
  'k9-ssc':               0.0012,
  'rescate-bomberos':     0.0009,
  'pipa-bomberos':        0.0008,
  'pc-busqueda-rescate':  0.0009,
  'pc-evaluacion':        0.0011,
  'cruzroja-basica':      0.0011,
  'cruzroja-intensiva':   0.0012,
  'convoy-sedena':        0.0008,
  'ingenieros-sedena':    0.0007,
  'marina-refuerzo':      0.0009,
  'helicoptero-condor':   0.0035,
  'helicoptero-marina':   0.0032,
}
const DEFAULT_SPEED = 0.0011
const TICK_MS = 100

function dist(a, b, c, d) { return Math.sqrt((a - c) ** 2 + (b - d) ** 2) }
function heading(a, b, c, d) { return Math.atan2(d - b, c - a) * 180 / Math.PI }

function moveStep(r, dt, speedMult) {
  if (!r.waypoints || r.waypoints.length === 0) return null
  const spd = (SPEED_BY_TYPE[r.typeCode] ?? DEFAULT_SPEED) * speedMult
  const step = spd * dt / 1000
  const [tLat, tLng] = r.waypoints[0]
  const d = dist(r.lat, r.lng, tLat, tLng)
  const h = heading(r.lat, r.lng, tLat, tLng)
  if (d <= step) {
    return { lat: tLat, lng: tLng, heading: h, waypoints: r.waypoints.slice(1) }
  }
  const t = step / d
  return {
    lat: r.lat + (tLat - r.lat) * t,
    lng: r.lng + (tLng - r.lng) * t,
    heading: h, waypoints: r.waypoints,
  }
}

// ── Componente driver ──────────────────────────────────────────
export function SciSimulationDriver({ state, dispatch }) {
  const lastRef      = useRef(performance.now())
  const stateRef     = useRef(state)
  const patrolTickRef = useRef(0)   // throttle patrol updates
  stateRef.current = state

  // ── tick loop ──
  useEffect(() => {
    if (!state.sci.running) return
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(now - lastRef.current, 250)
      lastRef.current = now

      const s = stateRef.current
      const speedMult = s.sci.speed
      const updates = []
      const arrivals = []
      const eventLog = []

      // Mover recursos con waypoints (asignados + patrulla)
      patrolTickRef.current++
      const isPatrolTick = patrolTickRef.current % 4 === 0  // patrol updates every 400 ms

      Object.values(s.sci.resources.byId).forEach(r => {
        if (!r.mobile) return

        const isPatrol = r.state === 'disponible'

        // Asignar patrulla ambient en modo auto a unidades disponibles sin ruta
        if (s.sci.mode === 'auto' && isPatrol && (!r.waypoints || r.waypoints.length === 0)) {
          if (!isPatrolTick) return   // wait for patrol tick before assigning new waypoint
          const angle  = Math.random() * 2 * Math.PI
          const radius = 0.003 + Math.random() * 0.005   // ~330–880 m
          const tLat = r.baseLat + Math.cos(angle) * radius * 0.75
          const tLng = r.baseLng + Math.sin(angle) * radius
          updates.push({ id: r.id, waypoints: [[tLat, tLng]] })
          return
        }

        if (!r.waypoints || r.waypoints.length === 0) return

        // Patrol units: only move on patrol ticks to reduce marker re-renders
        if (isPatrol && !isPatrolTick) return

        const next = moveStep(r, isPatrol ? dt * 4 : dt, speedMult)
        if (!next) return
        const update = { id: r.id, ...next }
        if (next.waypoints.length === 0 && r.waypoints.length > 0) {
          if (r.state === 'asignado' && r.assignedIncidentId != null) {
            arrivals.push({ resourceId: r.id, incidentId: r.assignedIncidentId, label: r.label })
            const dep = SCI_DEPENDENCIES[r.dependency]
            eventLog.push({ level: 'arrival', msg: `[${dep?.label ?? r.dependency}] ${r.label} llegó al sitio — en escena` })
          }
        }
        if (r.eta != null) update.eta = Math.max(0, r.eta - dt / speedMult)
        updates.push(update)
      })

      // Auto timeline (modo simular)
      if (s.sci.mode === 'auto' && s.sci.autoTimeline) {
        const elapsed = (Date.now() - s.sci.autoTimeline.startedAt) * speedMult
        s.sci.autoTimeline.events.forEach((ev, idx) => {
          if (s.sci.autoTimeline.fired.includes(idx)) return
          if (elapsed >= ev.atMs) {
            // Commit incident
            dispatch({ type: 'SCI_COMMIT_INCIDENT', payload: {
              type: ev.type,
              lat: ev.lat, lng: ev.lng,
              fields: ev.fields, zones: ev.zones,
              parentId: null,
            }})
            dispatch({ type: 'SCI_MARK_TIMELINE_FIRED', payload: idx })

            // Inject narrative log entries
            if (ev.narrativeLog?.length) {
              ev.narrativeLog.forEach(n => {
                dispatch({ type: 'SCI_LOG_EVENT', payload: { level: n.level, msg: n.msg } })
              })
            }

            // Auto-place SCI special zones (PC, ACV, Triage, Staging, Helipuerto)
            if (ev.sciZones?.length) {
              ev.sciZones.forEach(z => {
                dispatch({ type: 'SCI_ADD_ZONE', payload: {
                  type: z.type,
                  lat: z.lat,
                  lng: z.lng,
                  label: z.label ?? '',
                  incidentId: null,
                }})
              })
            }
          }
        })
      }

      if (updates.length || arrivals.length || eventLog.length) {
        dispatch({ type: 'SCI_TICK', payload: { updates, arrivals, eventLog } })
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [state.sci.running, dispatch])

  // ── Auto-despacho inteligente por tipo de responder ──
  useEffect(() => {
    if (state.sci.mode !== 'auto') return
    const unassigned = state.sci.incidents.filter(i => i.assignedUnitIds.length === 0 && i.status === 'active')
    if (unassigned.length === 0) return

    unassigned.forEach(inc => {
      const typeDef = SCI_INCIDENT_TYPES[inc.type]
      const required = typeDef?.requiredResponders ?? ['ERUM']
      const resourcesById = state.sci.resources.byId

      required.forEach(dep => {
        // Buscar unidad disponible más cercana de esta dependencia
        const candidates = Object.values(resourcesById)
          .filter(r => r.mobile && r.state === 'disponible' && r.dependency === dep)
          .map(r => ({ r, d: Math.hypot(r.lat - inc.lat, r.lng - inc.lng) }))
          .sort((a, b) => a.d - b.d)

        if (candidates.length === 0) return
        const { r } = candidates[0]
        const wps = streetRoute(r.lat, r.lng, inc.lat, inc.lng)
        const eta = estimateEta(r, wps)
        const depInfo = SCI_DEPENDENCIES[dep]

        dispatch({ type: 'SCI_ASSIGN_RESOURCE', payload: {
          resourceId: r.id, incidentId: inc.id, waypoints: wps, eta,
        }})

        // Log de despacho con ETA
        dispatch({ type: 'SCI_LOG_EVENT', payload: {
          level: 'dispatch',
          msg: `[${depInfo?.label ?? dep}] ${r.label} despachada → ${inc.clave} (ETA ${fmtEta(eta)})`,
        }})
      })
    })
  }, [state.sci.incidents.length, state.sci.mode, dispatch])  // eslint-disable-line

  return null
}

export function estimateEta(resource, waypoints) {
  if (!waypoints || waypoints.length === 0) return 0
  const spd = SPEED_BY_TYPE[resource.typeCode] ?? DEFAULT_SPEED
  let total = 0
  let lat = resource.lat, lng = resource.lng
  for (const [tLat, tLng] of waypoints) {
    total += Math.hypot(tLat - lat, tLng - lng)
    lat = tLat; lng = tLng
  }
  return (total / spd) * 1000
}

export default function useSciSimulation() {
  return useRef(null)
}
