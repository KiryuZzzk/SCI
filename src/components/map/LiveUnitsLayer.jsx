import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const TYPE_LETTER = { ambulance:'A', police:'P', firefighter:'B' }
const TYPE_NAME   = { ambulance:'Ambulancia', police:'Patrulla', firefighter:'Bomberos' }
const STATUS_ES   = { patrol:'Patrulla', responding:'En camino', atScene:'En escena', transporting:'Traslado', returning:'Regresando' }

function makeIcon({ color, heading, status, type }) {
  const active  = status === 'responding' || status === 'atScene' || status === 'transporting'
  const letter  = TYPE_LETTER[type]
  const pulse   = active ? '<div class="luu-ring"></div>' : ''
  const arrow   = `<div class="luu-arrow" style="transform:rotate(${heading - 90}deg)">
    <svg width="9" height="9" viewBox="0 0 9 9"><polygon points="4.5,0 9,9 4.5,6.5 0,9" fill="${color}" opacity="0.85"/></svg>
  </div>`

  return L.divIcon({
    html: `<div class="luu" style="--c:${color}">${arrow}<div class="luu-dot">${letter}</div>${pulse}</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function LiveUnitsLayer({ units }) {
  const map = useMap()
  const markersRef  = useRef({})
  const routeLinesRef = useRef({})

  useEffect(() => {
    const currentIds = new Set(units.map(u => u.id))

    // Remove stale
    for (const id of Object.keys(markersRef.current)) {
      if (!currentIds.has(Number(id))) {
        markersRef.current[id].remove()
        routeLinesRef.current[id]?.remove()
        delete markersRef.current[id]
        delete routeLinesRef.current[id]
      }
    }

    units.forEach(unit => {
      // ── Route preview line (only when responding) ──
      const showRoute = unit.status === 'responding' && unit.waypoints?.length > 0
      if (showRoute) {
        const pts = [[unit.lat, unit.lng], ...unit.waypoints]
        if (routeLinesRef.current[unit.id]) {
          routeLinesRef.current[unit.id].setLatLngs(pts)
        } else {
          routeLinesRef.current[unit.id] = L.polyline(pts, {
            color: unit.color,
            weight: 1.5,
            opacity: 0.45,
            dashArray: '4 5',
          }).addTo(map)
        }
      } else {
        routeLinesRef.current[unit.id]?.remove()
        delete routeLinesRef.current[unit.id]
      }

      // ── Unit marker ──
      if (markersRef.current[unit.id]) {
        markersRef.current[unit.id].setLatLng([unit.lat, unit.lng])
        markersRef.current[unit.id].setIcon(makeIcon(unit))
        markersRef.current[unit.id].getTooltip()?.setContent(
          `${TYPE_NAME[unit.type]} · ${STATUS_ES[unit.status] ?? unit.status}`
          + (unit.destination ? `\n→ ${unit.destination.name}` : '')
        )
      } else {
        const m = L.marker([unit.lat, unit.lng], {
          icon: makeIcon(unit),
          zIndexOffset: 600,
        })
        m.bindTooltip(
          `${TYPE_NAME[unit.type]} · ${STATUS_ES[unit.status] ?? unit.status}`,
          { permanent: false, direction: 'top', offset: [0, -13], className: 'live-tooltip' }
        )
        m.addTo(map)
        markersRef.current[unit.id] = m
      }
    })
  }, [units, map])

  useEffect(() => () => {
    Object.values(markersRef.current).forEach(m => m.remove())
    Object.values(routeLinesRef.current).forEach(l => l.remove())
    markersRef.current = {}
    routeLinesRef.current = {}
  }, [map])

  return null
}
