import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const INC_LABEL = { medical:'Urgencia médica', fire:'Incendio', traffic:'Accidente vial', security:'Seg. pública' }
const INC_ICON  = { medical:'🚑', fire:'🔥', traffic:'🚗', security:'🚨' }
const STATUS_ES = { reported:'Reportado', dispatched:'Unidad en camino', attended:'En atención', resolved:'Resuelto' }
const UNIT_ES   = { ambulance:'Ambulancia', police:'Patrulla', firefighter:'Bomberos' }

function makeCard(inc) {
  const { color, type, status, assignedUnitType, resolved } = inc
  const opacity = resolved ? 0 : 1
  const statusText = resolved ? 'Resuelto' : (STATUS_ES[status] ?? status)
  const pulse = (!resolved && status !== 'attended')
    ? `<div class="linc-ring linc-ring--1"></div><div class="linc-ring linc-ring--2"></div>`
    : ''
  const unit = assignedUnitType ? `<span class="linc-unit">${UNIT_ES[assignedUnitType]}</span>` : ''

  return L.divIcon({
    html: `
      <div class="linc" style="--ic:${color};opacity:${opacity}">
        ${pulse}
        <div class="linc-dot">${INC_ICON[type] ?? '⚠'}</div>
        <div class="linc-card">
          <span class="linc-title">${INC_LABEL[type]}</span>
          <span class="linc-status">${statusText}</span>
          ${unit}
        </div>
      </div>`,
    className: '',
    iconSize: [140, 44],
    iconAnchor: [16, 16],
  })
}

export default function LiveIncidentsLayer({ incidents }) {
  const map = useMap()
  const markersRef = useRef({})

  useEffect(() => {
    const currentIds = new Set(incidents.map(i => i.id))

    for (const id of Object.keys(markersRef.current)) {
      if (!currentIds.has(Number(id))) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    }

    incidents.forEach(inc => {
      if (markersRef.current[inc.id]) {
        markersRef.current[inc.id].setIcon(makeCard(inc))
      } else {
        const m = L.marker([inc.lat, inc.lng], {
          icon: makeCard(inc),
          zIndexOffset: 500,
          interactive: false,
        }).addTo(map)
        markersRef.current[inc.id] = m
      }
    })
  }, [incidents, map])

  useEffect(() => () => {
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
  }, [map])

  return null
}
