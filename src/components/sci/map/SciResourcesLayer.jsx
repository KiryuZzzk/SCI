import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_DEPENDENCIES } from '../../../constants/sciDependencies.js'
import { sciUnitSvg } from '../../../utils/leafletIcons.js'

function makeIcon(r) {
  const dotSize = r.mobile ? 22 : 26
  const svgSize = Math.round(dotSize * 0.58)
  const iconSvg = sciUnitSvg(r.typeCode, r.color, svgSize)
  const ring    = r.state === 'asignado' ? '<div class="sci-unit-ring"></div>' : ''
  const heading = r.heading ?? 0
  const arrow = r.mobile && r.state === 'asignado'
    ? `<div class="sci-unit-arrow" style="transform:rotate(${heading - 90}deg)">
         <svg width="9" height="9" viewBox="0 0 9 9"><polygon points="4.5,0 9,9 4.5,6.5 0,9" fill="${r.color}" opacity="0.7"/></svg>
       </div>`
    : ''
  return L.divIcon({
    html: `<div class="sci-unit" style="--c:${r.color}">
             ${arrow}
             <div class="sci-unit-dot ${r.mobile ? '' : 'sci-unit-fixed'}" style="display:flex;align-items:center;justify-content:center">${iconSvg}</div>
             ${ring}
           </div>`,
    className: '',
    iconSize:   r.mobile ? [22, 22] : [26, 26],
    iconAnchor: r.mobile ? [11, 11] : [13, 13],
  })
}

// Fingerprint for when icon HTML actually needs to change
function iconKey(r) {
  return `${r.state}|${Math.round((r.heading ?? 0) / 15) * 15}|${r.typeCode}`
}

export default function SciResourcesLayer() {
  const map = useMap()
  const { state, dispatch } = useAppContext()
  const markersRef  = useRef({})   // id → L.Marker
  const iconKeyRef  = useRef({})   // id → last iconKey string
  const { byId, allIds } = state.sci.resources
  const filters = state.sci.uiFilters

  useEffect(() => {
    const visibleIds = allIds.filter(id => {
      const r = byId[id]
      if (!r) return false
      if (filters.dependency !== 'all' && r.dependency !== filters.dependency) return false
      if (filters.state     !== 'all' && r.state      !== filters.state)      return false
      if (filters.typeCode  !== 'all' && r.typeCode   !== filters.typeCode)   return false
      return true
    })

    // Remove markers no longer visible
    const visibleSet = new Set(visibleIds)
    for (const id of Object.keys(markersRef.current)) {
      if (!visibleSet.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        delete iconKeyRef.current[id]
      }
    }

    visibleIds.forEach(id => {
      const r = byId[id]
      const m = markersRef.current[id]

      if (m) {
        // Position update — always cheap
        m.setLatLng([r.lat, r.lng])

        // Icon update — only when state/heading/type actually changed
        const key = iconKey(r)
        if (iconKeyRef.current[id] !== key) {
          m.setIcon(makeIcon(r))
          iconKeyRef.current[id] = key
        }
      } else {
        // New marker
        const dep = SCI_DEPENDENCIES[r.dependency]
        const marker = L.marker([r.lat, r.lng], {
          icon: makeIcon(r),
          zIndexOffset: r.mobile ? 600 : 400,
        })
        marker.bindTooltip(
          `${r.label}<br><span style="color:#94a3b8;font-size:10px">${dep?.label ?? r.dependency} · ${r.state}</span>`,
          { permanent: false, direction: 'top', offset: [0, -14], className: 'live-tooltip' }
        )
        marker.on('click', () => dispatch({ type: 'SCI_SELECT_RESOURCE', payload: id }))
        marker.addTo(map)
        markersRef.current[id]  = marker
        iconKeyRef.current[id]  = iconKey(r)
      }
    })
  }, [byId, allIds, filters, map, dispatch])

  useEffect(() => () => {
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    iconKeyRef.current = {}
  }, [map])

  return null
}
