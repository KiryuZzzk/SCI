import { memo } from 'react'
import { GeoJSON } from 'react-leaflet'

const ALCALDIA_STYLE = {
  color: '#3b82f6',
  weight: 1.5,
  fill: false,
  opacity: 0.4,
}

const AlcaldiaLayer = memo(function AlcaldiaLayer({ alcaldias }) {
  return (
    <GeoJSON
      data={alcaldias}
      style={ALCALDIA_STYLE}
    />
  )
})

export default AlcaldiaLayer
