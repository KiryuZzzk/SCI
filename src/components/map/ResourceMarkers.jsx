import { memo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { BRECHA_SVG } from '../../utils/leafletIcons.js'

function makeDivIcon(svgHtml, bg = '#0a0f1a') {
  return L.divIcon({
    html: `<div style="
      width:20px;height:20px;
      background:${bg};
      border:1px solid rgba(255,255,255,0.15);
      border-radius:4px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 1px 4px rgba(0,0,0,0.6)
    ">${svgHtml}</div>`,
    className: '',
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
  })
}

const HOSPITAL_ICON = makeDivIcon(BRECHA_SVG.hospital())
const FIRE_ICON     = makeDivIcon(BRECHA_SVG.fireStation())
const HYPO_ICON     = makeDivIcon(BRECHA_SVG.hypo())

const ResourceMarkers = memo(function ResourceMarkers({ hospitals, fireStations, hypothetical = [] }) {
  return (
    <>
      {hospitals.map((h, i) => (
        <Marker key={`h-${i}`} position={[h.lat, h.lng]} icon={HOSPITAL_ICON}>
          <Tooltip sticky>{h.nombre || 'Hospital'}</Tooltip>
        </Marker>
      ))}

      {fireStations.map((f, i) => (
        <Marker key={`f-${i}`} position={[f.lat, f.lng]} icon={FIRE_ICON}>
          <Tooltip sticky>{f.nombre || 'Estación de Bomberos'}</Tooltip>
        </Marker>
      ))}

      {hypothetical.map(h => (
        <Marker
          key={`hypo-${h.id}`}
          position={[h.lat, h.lng]}
          icon={HYPO_ICON}
        >
          <Tooltip sticky>
            {h.type === 'hospital' ? 'Hospital hipotético' : 'Estación hipotética'}
          </Tooltip>
        </Marker>
      ))}
    </>
  )
})

export default ResourceMarkers
