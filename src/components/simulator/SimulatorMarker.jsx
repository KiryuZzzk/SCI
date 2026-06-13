import { useRef, useCallback } from 'react'
import { CircleMarker, Circle, Tooltip, useMap } from 'react-leaflet'
import useSimulator from '../../hooks/useSimulator.js'

const COLORS = { hospital: '#22c55e', fireStation: '#22c55e' }
const COVERAGE_RADIUS = { hospital: 3000, fireStation: 2000 } // meters

export default function SimulatorMarker({ resource }) {
  const { moveResource, removeResource } = useSimulator()
  const markerRef = useRef(null)

  const color = COLORS[resource.type] || '#22c55e'
  const coverageM = COVERAGE_RADIUS[resource.type] || 2000

  const onDragEnd = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    moveResource(resource.id, lat, lng)
  }, [resource.id, moveResource])

  return (
    <>
      {/* Coverage circle */}
      <Circle
        center={[resource.lat, resource.lng]}
        radius={coverageM}
        pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: 0.08, dashArray: '6 4' }}
      />

      {/* Draggable marker */}
      <CircleMarker
        ref={markerRef}
        center={[resource.lat, resource.lng]}
        radius={7}
        pathOptions={{ fillColor: color, color: '#ffffff', weight: 2, fillOpacity: 1 }}
        draggable
        eventHandlers={{ dragend: onDragEnd }}
      >
        <Tooltip permanent={false} sticky>
          <span>
            {resource.type === 'hospital' ? 'Hospital hipotético' : 'Bomberos hipotético'}
            <br />
            <span
              className="text-accent cursor-pointer underline"
              onClick={() => removeResource(resource.id)}
            >
              Eliminar
            </span>
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  )
}
