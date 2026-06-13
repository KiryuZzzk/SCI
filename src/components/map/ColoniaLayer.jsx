import { memo, useCallback } from 'react'
import { GeoJSON } from 'react-leaflet'
import { scoreToColor } from '../../constants/colors.js'

const ColoniaLayer = memo(function ColoniaLayer({ colonias, scores, mapMode, onColoniaClick }) {
  // GeoJSON is not reactive — key change forces full remount when scores update
  const scoreKey = scores.size

  const style = useCallback((feature) => {
    const cve = feature.properties.CVE_GEO
    const entry = scores.get(cve)
    const color = entry ? scoreToColor(entry.score) : '#243040'

    return {
      fillColor: color,
      fillOpacity: 0.28,
      color: '#0a0f1a',
      weight: 0.25,
      opacity: 0.7,
    }
  }, [scores])

  const onEachFeature = useCallback((feature, layer) => {
    layer.on('click', () => {
      const cve = feature.properties.CVE_GEO
      const entry = scores.get(cve)
      onColoniaClick(cve, { ...feature.properties, ...entry })
    })

    layer.on('mouseover', (e) => {
      e.target.setStyle({ weight: 1.5, color: '#f0f4f8', fillOpacity: 0.85 })
      e.target.bringToFront()
    })

    layer.on('mouseout', (e) => {
      e.target.setStyle(style(feature))
    })
  }, [scores, onColoniaClick, style])

  return (
    <GeoJSON
      key={scoreKey.current}
      data={colonias}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
})

export default ColoniaLayer
