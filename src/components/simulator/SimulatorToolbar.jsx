import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdLocalHospital, MdLocalFireDepartment, MdDelete, MdAddLocation } from 'react-icons/md'
import { EASE_OUT_EXPO } from '../../constants/colors.js'
import useSimulator from '../../hooks/useSimulator.js'
import { useMapEvents } from 'react-leaflet'

const RESOURCE_TYPES = [
  { key: 'hospital',     label: 'Hospital',  Icon: MdLocalHospital,      color: '#f472b6' },
  { key: 'fireStation',  label: 'Bomberos',  Icon: MdLocalFireDepartment, color: '#fb923c' },
]

function MapClickHandler({ active, resourceType, onAdd }) {
  useMapEvents({
    click(e) {
      if (active) onAdd(resourceType, e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function SimulatorToolbar() {
  const [placing, setPlacing] = useState(false)
  const [selectedType, setSelectedType] = useState('hospital')
  const { hypothetical, addResource, reset } = useSimulator()

  const handleAdd = (type, lat, lng) => {
    addResource(type, lat, lng)
    setPlacing(false)
  }

  return (
    <>
      {placing && (
        <MapClickHandler active={placing} resourceType={selectedType} onAdd={handleAdd} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-bg/90 backdrop-blur-md border border-surface-3 rounded-2xl px-4 py-3 flex items-center gap-3"
      >
        <span className="text-muted text-xs">Agregar:</span>

        {RESOURCE_TYPES.map(rt => (
          <button
            key={rt.key}
            onClick={() => {
              setSelectedType(rt.key)
              setPlacing(p => selectedType === rt.key ? !p : true)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
              placing && selectedType === rt.key
                ? 'border-current text-foreground bg-surface-2'
                : 'border-surface-3 text-muted hover:text-foreground'
            }`}
            style={{ color: placing && selectedType === rt.key ? rt.color : undefined }}
          >
            <rt.Icon size={14} />
            {rt.label}
          </button>
        ))}

        <div className="w-px h-4 bg-surface-3" />

        <span className="text-muted text-xs font-mono">{hypothetical.length} añadidos</span>

        {hypothetical.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
          >
            <MdDelete size={14} />
            Limpiar
          </button>
        )}

        {placing && (
          <span className="text-xs text-accent animate-pulse">
            Haz clic en el mapa
          </span>
        )}
      </motion.div>
    </>
  )
}
