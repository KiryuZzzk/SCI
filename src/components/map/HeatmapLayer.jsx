import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { getColoniaCentroid } from '../../utils/geo.js'

export default function HeatmapLayer({ colonias, incidents, activeTypes }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!colonias || !incidents?.data) return

    const points = []
    for (const feature of colonias.features) {
      const cve = feature.properties.CVE_GEO
      const inc = incidents.data[cve]
      if (!inc) continue

      let count = 0
      for (const type of activeTypes) {
        count += inc.byType?.[type] || 0
      }
      if (count === 0) continue

      const [lng, lat] = getColoniaCentroid(feature)
      const pop = feature.properties.population || 1
      const intensity = count / (pop / 10000) // per 10k

      points.push([lat, lng, intensity])
    }

    // Normalize to 0-1
    const max = Math.max(...points.map(p => p[2]), 1)
    const normalized = points.map(([lat, lng, v]) => [lat, lng, v / max])

    if (layerRef.current) map.removeLayer(layerRef.current)
    layerRef.current = L.heatLayer(normalized, {
      radius: 25,
      blur: 20,
      maxZoom: 13,
      gradient: { 0.2: '#22c55e', 0.5: '#f59e0b', 1.0: '#ef4444' },
    }).addTo(map)

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current)
    }
  }, [map, colonias, incidents, activeTypes])

  return null
}
