import { useEffect, useReducer, useRef, useCallback } from 'react'
import { streetRoute } from '../utils/streetRoute.js'

// ── Config ─────────────────────────────────────────────────────────────────────
const TICK_MS = 100

// Degrees/second — ~2x slower than before
const BASE_SPEED = { ambulance: 0.0011, police: 0.0014, firefighter: 0.0009 }

const RESPONDER     = { medical: 'ambulance', fire: 'firefighter', traffic: 'ambulance', security: 'police' }
const SCENE_DURATION = { medical: 14000, fire: 22000, traffic: 11000, security: 9000 } // ms

const INC_INTERVAL_MIN = 7000
const INC_INTERVAL_MAX = 13000
const MAX_ACTIVE_INCIDENTS = 10

const INCIDENT_TYPES   = ['security','security','security','traffic','traffic','medical','fire']
const INCIDENT_COLORS  = { medical:'#f472b6', fire:'#fb923c', traffic:'#a78bfa', security:'#38bdf8' }
const UNIT_COLORS      = { ambulance:'#f472b6', police:'#38bdf8', firefighter:'#fb923c' }

const INC_LABELS  = { medical:'Urgencia médica', fire:'Incendio', traffic:'Accidente vial', security:'Seg. pública' }
const UNIT_LABELS = { ambulance:'Ambulancia', police:'Patrulla', firefighter:'Bomberos' }

// ── Facility locations ─────────────────────────────────────────────────────────
// Hospitals (ambulance transport destination)
const HOSPITALS = [
  { lat:19.4124, lng:-99.1571, name:'Hosp. General de México' },
  { lat:19.4467, lng:-99.1329, name:'Hosp. Juárez' },
  { lat:19.3693, lng:-99.0638, name:'Hosp. Pemex Iztapalapa' },
  { lat:19.4651, lng:-99.1502, name:'Hosp. La Raza IMSS' },
  { lat:19.3850, lng:-99.1700, name:'Hosp. Español' },
  { lat:19.3510, lng:-99.1575, name:'INER Tlalpan' },
  { lat:19.4221, lng:-99.0821, name:'Hosp. Gea González' },
]

// Ministerio Público (police transport destination)
const MP_LOCATIONS = [
  { lat:19.4271, lng:-99.1360, name:'FGJ Cuauhtémoc' },
  { lat:19.3665, lng:-99.0600, name:'FGJ Iztapalapa' },
  { lat:19.4700, lng:-99.1188, name:'FGJ Gustavo A.M.' },
  { lat:19.3987, lng:-99.1590, name:'FGJ Benito Juárez' },
  { lat:19.4220, lng:-99.0892, name:'FGJ V. Carranza' },
  { lat:19.4830, lng:-99.1862, name:'FGJ Azcapotzalco' },
]

// ── CDMX weighted spawn zones ──────────────────────────────────────────────────
const SPAWN_ZONES = [
  [19.4270,-99.1352,4],[19.3650,-99.0620,4],[19.4700,-99.1150,3],
  [19.4000,-99.1600,3],[19.4200,-99.0900,2],[19.3900,-99.1050,2],
  [19.4800,-99.1950,2],[19.3500,-99.1700,2],[19.3700,-99.2100,1],
  [19.4350,-99.2050,1],[19.2980,-99.1700,1],[19.2600,-99.1000,1],
]
const SPAWN_POOL = []
SPAWN_ZONES.forEach(([lat,lng,w]) => { for(let i=0;i<w;i++) SPAWN_POOL.push([lat,lng]) })

// ── Unit bases ─────────────────────────────────────────────────────────────────
const UNIT_BASES = {
  ambulance: [
    [19.4280,-99.1401],[19.4700,-99.1200],[19.3650,-99.0510],
    [19.3980,-99.1580],[19.3950,-99.1050],[19.4250,-99.0850],
  ],
  police: [
    [19.4270,-99.1352],[19.4890,-99.1201],[19.3650,-99.0510],
    [19.4000,-99.1600],[19.4200,-99.0900],[19.4850,-99.1850],
    [19.3720,-99.2100],[19.2950,-99.1700],
  ],
  firefighter: [
    [19.4280,-99.1401],[19.3500,-99.1630],[19.2580,-99.1020],[19.4350,-99.2000],
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────────────
let _uid = 1
const uid = () => _uid++

function jitter(scale=0.015) { return (Math.random()-0.5)*scale }
function dist(a,b,c,d)       { return Math.sqrt((a-c)**2+(b-d)**2) }
function heading(a,b,c,d)    { return Math.atan2(d-b,c-a)*180/Math.PI }
function clamp(v,lo,hi)      { return Math.max(lo,Math.min(hi,v)) }

function spawnPos() {
  const [lat,lng] = SPAWN_POOL[Math.floor(Math.random()*SPAWN_POOL.length)]
  return [lat+jitter(0.025), lng+jitter(0.025)]
}

function patrolTarget(bLat,bLng) {
  return [bLat+jitter(0.05), bLng+jitter(0.05)]
}

function nearestFacility(facilities, lat, lng) {
  return facilities.reduce((best,f) => {
    const d = dist(lat,lng,f.lat,f.lng)
    return d < best.d ? {f,d} : best
  }, {f:facilities[0],d:Infinity}).f
}

function nextIncidentDelay(spd) {
  return Date.now() + (INC_INTERVAL_MIN + Math.random()*(INC_INTERVAL_MAX-INC_INTERVAL_MIN)) / spd
}

// ── Initial state ──────────────────────────────────────────────────────────────
function createInitialState() {
  const units = []
  for (const [type, bases] of Object.entries(UNIT_BASES)) {
    bases.forEach(([bLat,bLng]) => {
      const tgt = patrolTarget(bLat,bLng)
      const waypoints = streetRoute(bLat+jitter(0.02), bLng+jitter(0.02), tgt[0], tgt[1])
      units.push({
        id: uid(), type, color: UNIT_COLORS[type],
        lat: bLat+jitter(0.02), lng: bLng+jitter(0.02),
        baseLat: bLat, baseLng: bLng,
        waypoints,                        // remaining waypoints to consume
        heading: Math.random()*360,
        status: 'patrol',                 // patrol|responding|atScene|transporting|returning
        assignedIncidentId: null,
        timeAtScene: 0,
        destination: null,                // { lat, lng, name } for transport
      })
    })
  }
  return { units, incidents: [], log: [], nextIncidentAt: Date.now()+3000 }
}

// ── Move a unit one tick along its waypoints ───────────────────────────────────
function moveUnit(u, dt, speed) {
  if (!u.waypoints || u.waypoints.length === 0) return u

  const spd = BASE_SPEED[u.type] * speed
  const step = spd * dt / 1000

  const [tLat, tLng] = u.waypoints[0]
  const d = dist(u.lat, u.lng, tLat, tLng)

  const h = heading(u.lat, u.lng, tLat, tLng)

  if (d <= step) {
    // Reached current waypoint — advance to next
    const remaining = u.waypoints.slice(1)
    return { ...u, lat: tLat, lng: tLng, heading: h, waypoints: remaining }
  }

  const t = step / d
  return {
    ...u,
    lat: u.lat + (tLat - u.lat) * t,
    lng: u.lng + (tLng - u.lng) * t,
    heading: h,
  }
}

// ── Simulation tick ────────────────────────────────────────────────────────────
function tick(state, dt, spd) {
  const now = Date.now()
  let { units, incidents, log, nextIncidentAt } = state

  // 1. Advance units at scene timer
  units = units.map(u =>
    u.status === 'atScene' ? { ...u, timeAtScene: u.timeAtScene + dt } : u
  )

  // 2. Resolve scene when timer expires → send to facility
  const resolvedIds = new Set()
  units = units.map(u => {
    if (u.status !== 'atScene') return u
    if (u.timeAtScene < SCENE_DURATION[
          incidents.find(i => i.id === u.assignedIncidentId)?.type ?? 'security'
        ] / spd) return u

    resolvedIds.add(u.assignedIncidentId)

    // Determine post-scene destination
    let destination = null
    let nextStatus = 'returning'
    let waypoints = streetRoute(u.lat, u.lng, u.baseLat, u.baseLng)

    if (u.type === 'ambulance') {
      const hosp = nearestFacility(HOSPITALS, u.lat, u.lng)
      destination = hosp
      nextStatus = 'transporting'
      waypoints = streetRoute(u.lat, u.lng, hosp.lat, hosp.lng)
    } else if (u.type === 'police') {
      const mp = nearestFacility(MP_LOCATIONS, u.lat, u.lng)
      destination = mp
      nextStatus = 'transporting'
      waypoints = streetRoute(u.lat, u.lng, mp.lat, mp.lng)
    }
    // firefighters go straight back to base

    return {
      ...u,
      status: nextStatus,
      assignedIncidentId: null,
      timeAtScene: 0,
      destination,
      waypoints,
    }
  })

  // 3. Mark incidents resolved
  incidents = incidents.map(inc =>
    resolvedIds.has(inc.id) ? { ...inc, resolved: true, resolvedAt: now } : inc
  )

  // 4. Finish transport → return to base
  units = units.map(u => {
    if (u.status !== 'transporting') return u
    if (u.waypoints.length > 0) return u  // still en route
    // Arrived at facility — now route back to base
    return {
      ...u,
      status: 'returning',
      destination: null,
      waypoints: streetRoute(u.lat, u.lng, u.baseLat, u.baseLng),
    }
  })

  // 5. Finish returning → back to patrol
  units = units.map(u => {
    if (u.status !== 'returning') return u
    if (u.waypoints.length > 0) return u
    const tgt = patrolTarget(u.baseLat, u.baseLng)
    return {
      ...u,
      status: 'patrol',
      waypoints: streetRoute(u.lat, u.lng, tgt[0], tgt[1]),
    }
  })

  // 6. Patrol — pick new target when waypoints exhausted
  units = units.map(u => {
    if (u.status !== 'patrol') return u
    if (u.waypoints.length > 0) return u
    const tgt = patrolTarget(u.baseLat, u.baseLng)
    return { ...u, waypoints: streetRoute(u.lat, u.lng, tgt[0], tgt[1]) }
  })

  // 7. Move all non-scene units along waypoints
  units = units.map(u => {
    if (u.status === 'atScene') return u
    return moveUnit(u, dt, spd)
  })

  // 8. Remove resolved incidents after CSS fade (1.2s)
  incidents = incidents.filter(i => !i.resolved || (i.resolvedAt && now - i.resolvedAt < 1200))

  // 9. Spawn new incident
  if (now >= nextIncidentAt && incidents.filter(i=>!i.resolved).length < MAX_ACTIVE_INCIDENTS) {
    const type  = INCIDENT_TYPES[Math.floor(Math.random()*INCIDENT_TYPES.length)]
    const [lat,lng] = spawnPos()
    const newInc = {
      id: uid(), type, lat, lng, color: INCIDENT_COLORS[type],
      createdAt: now, resolved: false, resolvedAt: null,
      assignedUnitId: null, assignedUnitType: null,
      status: 'reported',   // reported | dispatched | attended | resolved
    }

    // Dispatch nearest available unit
    const respType = RESPONDER[type]
    const available = units.filter(u => u.type === respType && u.status === 'patrol')
    if (available.length) {
      const nearest = available.reduce((best,u) => {
        const d = dist(u.lat,u.lng,lat,lng)
        return d < best.d ? {u,d} : best
      }, {u:null,d:Infinity}).u

      if (nearest) {
        newInc.assignedUnitId   = nearest.id
        newInc.assignedUnitType = nearest.type
        newInc.status = 'dispatched'

        const waypoints = streetRoute(nearest.lat, nearest.lng, lat, lng)
        units = units.map(u => u.id===nearest.id ? {
          ...u, status:'responding',
          assignedIncidentId: newInc.id,
          waypoints,
        } : u)

        log = [`${UNIT_LABELS[respType]} → ${INC_LABELS[type]}`, ...log].slice(0,7)
      }
    }

    incidents = [...incidents, newInc]
    nextIncidentAt = nextIncidentDelay(spd)
  }

  // 10. Sync incident status from unit state
  incidents = incidents.map(inc => {
    if (inc.resolved) return inc
    const unit = units.find(u => u.assignedIncidentId === inc.id)
    if (!unit) return inc
    if (unit.status === 'atScene')     return { ...inc, status:'attended' }
    if (unit.status === 'responding')  return { ...inc, status:'dispatched' }
    return inc
  })

  return { units, incidents, log, nextIncidentAt }
}

// ── Reducer ────────────────────────────────────────────────────────────────────
function simReducer(state, action) {
  switch (action.type) {
    case 'TICK':  return tick(state, action.dt, action.speed)
    case 'RESET': return createInitialState()
    default:      return state
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export default function useLiveSimulation(running, speedMultiplier=1) {
  const [state, dispatch] = useReducer(simReducer, null, createInitialState)
  const lastRef = useRef(performance.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const now = performance.now()
      const dt  = Math.min(now - lastRef.current, 250)
      lastRef.current = now
      dispatch({ type:'TICK', dt, speed: speedMultiplier })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [running, speedMultiplier])

  const reset = useCallback(() => dispatch({ type:'RESET' }), [])
  return { units: state.units, incidents: state.incidents, log: state.log, reset }
}
