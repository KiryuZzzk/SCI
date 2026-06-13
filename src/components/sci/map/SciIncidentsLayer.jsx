import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppContext } from '../../../context/AppContext.jsx'
import { incidentType } from '../../../constants/sciIncidentTypes.js'
import { sciIncidentSvg } from '../../../utils/leafletIcons.js'

const ZONE_STYLE = {
  red:    { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.45, weight: 2.5, opacity: 0.95 },
  yellow: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.28, weight: 2,   opacity: 0.90 },
  green:  { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15, weight: 1.5, opacity: 0.80 },
}

function makeIcon(inc) {
  const t = incidentType(inc.type)
  const color = t?.color ?? '#ef4444'
  const isSecondary = inc.parentId != null
  const dotSize = isSecondary ? 20 : 26
  const iconSvg = sciIncidentSvg(inc.type, color, Math.round(dotSize * 0.54))
  return L.divIcon({
    html: `
      <div class="sci-incident" style="--c:${color}">
        <div style="position:relative;width:${dotSize}px;height:${dotSize}px;flex-shrink:0">
          <div class="sci-incident-pulse" style="width:${dotSize}px;height:${dotSize}px"></div>
          <div class="sci-incident-dot" style="width:${dotSize}px;height:${dotSize}px;display:flex;align-items:center;justify-content:center">${iconSvg}</div>
        </div>
        <div class="sci-incident-clave">${inc.clave}</div>
      </div>`,
    className: '',
    iconSize: [dotSize + 90, dotSize + 24],
    iconAnchor: [dotSize / 2, dotSize / 2],
  })
}

export default function SciIncidentsLayer() {
  const map = useMap()
  const { state, dispatch } = useAppContext()
  const markersRef = useRef({})
  const circlesRef = useRef({})  // { [incId]: { red, yellow, green } }
  const linesRef = useRef({})    // parent-child connectors
  const { incidents } = state.sci

  useEffect(() => {
    const currentIds = new Set(incidents.filter(i => i.status !== 'closed').map(i => i.id))

    // Limpiar cerrados
    for (const id of Object.keys(markersRef.current)) {
      const numId = Number(id)
      if (!currentIds.has(numId)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        const cs = circlesRef.current[id]
        if (cs) {
          Object.values(cs).forEach(c => c.remove())
          delete circlesRef.current[id]
        }
        if (linesRef.current[id]) {
          linesRef.current[id].remove()
          delete linesRef.current[id]
        }
      }
    }

    incidents.forEach(inc => {
      if (inc.status === 'closed') return
      // Marcador
      if (markersRef.current[inc.id]) {
        markersRef.current[inc.id].setLatLng([inc.lat, inc.lng])
        markersRef.current[inc.id].setIcon(makeIcon(inc))
      } else {
        const m = L.marker([inc.lat, inc.lng], {
          icon: makeIcon(inc),
          zIndexOffset: 700,
        })
        m.on('click', () => dispatch({ type: 'SCI_SELECT_INCIDENT', payload: inc.id }))
        m.addTo(map)
        markersRef.current[inc.id] = m
      }

      // Círculos concéntricos
      const existing = circlesRef.current[inc.id]
      if (existing) {
        existing.red.setLatLng([inc.lat, inc.lng]).setRadius(inc.zones.red)
        existing.yellow.setLatLng([inc.lat, inc.lng]).setRadius(inc.zones.yellow)
        existing.green.setLatLng([inc.lat, inc.lng]).setRadius(inc.zones.green)
      } else {
        circlesRef.current[inc.id] = {
          green: L.circle([inc.lat, inc.lng], { radius: inc.zones.green, ...ZONE_STYLE.green, interactive: false }).addTo(map),
          yellow: L.circle([inc.lat, inc.lng], { radius: inc.zones.yellow, ...ZONE_STYLE.yellow, interactive: false }).addTo(map),
          red: L.circle([inc.lat, inc.lng], { radius: inc.zones.red, ...ZONE_STYLE.red, interactive: false }).addTo(map),
        }
      }

      // Línea a padre si es secundario
      if (inc.parentId != null) {
        const parent = incidents.find(p => p.id === inc.parentId)
        if (parent) {
          const pts = [[parent.lat, parent.lng], [inc.lat, inc.lng]]
          if (linesRef.current[inc.id]) {
            linesRef.current[inc.id].setLatLngs(pts)
          } else {
            linesRef.current[inc.id] = L.polyline(pts, {
              color: '#facc15', weight: 1.5, opacity: 0.7, dashArray: '6 4', interactive: false,
            }).addTo(map)
          }
        }
      }
    })
  }, [incidents, map, dispatch])

  useEffect(() => () => {
    Object.values(markersRef.current).forEach(m => m.remove())
    Object.values(circlesRef.current).forEach(cs => Object.values(cs).forEach(c => c.remove()))
    Object.values(linesRef.current).forEach(l => l.remove())
    markersRef.current = {}
    circlesRef.current = {}
    linesRef.current = {}
  }, [map])

  return null
}
