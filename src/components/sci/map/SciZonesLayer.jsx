import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppContext } from '../../../context/AppContext.jsx'
import { zoneType } from '../../../constants/sciZoneTypes.js'
import { sciZoneSvg } from '../../../utils/leafletIcons.js'

function makeIcon(z) {
  const t = zoneType(z.type)
  const color = t?.color ?? '#facc15'
  const iconSvg = sciZoneSvg(z.type, color, 13)
  return L.divIcon({
    html: `
      <div class="sci-zone" style="--c:${color}">
        <div class="sci-zone-dot" style="display:flex;align-items:center;justify-content:center">${iconSvg}</div>
        <div class="sci-zone-label">${t?.label ?? z.type}${z.label ? ` · ${z.label}` : ''}</div>
      </div>`,
    className: '',
    iconSize: [120, 30],
    iconAnchor: [12, 12],
  })
}

export default function SciZonesLayer() {
  const map = useMap()
  const { state, dispatch } = useAppContext()
  const ref = useRef({})
  const { zones } = state.sci

  useEffect(() => {
    const ids = new Set(zones.map(z => z.id))
    for (const id of Object.keys(ref.current)) {
      if (!ids.has(Number(id))) {
        ref.current[id].remove()
        delete ref.current[id]
      }
    }
    zones.forEach(z => {
      if (ref.current[z.id]) {
        ref.current[z.id].setLatLng([z.lat, z.lng]).setIcon(makeIcon(z))
      } else {
        const m = L.marker([z.lat, z.lng], { icon: makeIcon(z), zIndexOffset: 550 })
        m.on('click', () => dispatch({ type: 'SCI_REMOVE_ZONE', payload: z.id }))
        m.addTo(map)
        ref.current[z.id] = m
      }
    })
  }, [zones, map, dispatch])

  useEffect(() => () => {
    Object.values(ref.current).forEach(m => m.remove())
    ref.current = {}
  }, [map])

  return null
}
