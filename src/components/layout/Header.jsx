import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext.jsx'
import { EASE_OUT_EXPO } from '../../constants/colors.js'
import { formatDate } from '../../utils/formatters.js'

export default function Header() {
  const { state, dispatch } = useAppContext()
  const { metadata, mapMode, simulatorActive, liveMode, appMode } = state

  const modes = [
    { key: 'gap',       label: 'Brecha',    title: 'Colonias coloreadas por déficit de cobertura (rojo = más vulnerable)' },
    { key: 'heatmap',   label: 'Calor',     title: 'Mapa de calor: concentración de incidentes históricos' },
    { key: 'resources', label: 'Recursos',  title: 'Distribución de hospitales y estaciones de bomberos (mapa limpio)' },
  ]

  const isSci = appMode === 'sci'

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 py-2.5 bg-bg/80 backdrop-blur-md border-b border-surface-3"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <path d="M16 3L29 10v12L16 29 3 22V10L16 3z" stroke="#e63946" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="3.5" fill="#e63946" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-display font-bold text-sm tracking-tight">CoberturaECMX</span>
          {metadata?.processedAt && (
            <span className="text-muted text-xs hidden md:inline">
              Datos: {formatDate(metadata.processedAt)}
            </span>
          )}
        </div>

        {/* Global app mode toggle */}
        <div className="ml-3 flex items-center gap-1 bg-surface rounded-lg p-1 border border-surface-3">
          {['gap', 'sci'].map(m => (
            <button
              key={m}
              onClick={() => dispatch({ type: 'SET_APP_MODE', payload: m })}
              className={`px-3 py-1 rounded-md text-xs font-display font-semibold transition-colors ${
                appMode === m
                  ? (m === 'sci' ? 'bg-accent text-white' : 'bg-surface-3 text-foreground')
                  : 'text-muted hover:text-foreground'
              }`}
              title={m === 'gap' ? 'Análisis de brechas históricas' : 'Simulador de Comando de Incidentes (SCI)'}
            >
              {m === 'gap' ? 'Brechas' : 'SCI'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector (only in gap) */}
      {!isSci && (
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => dispatch({ type: 'SET_MAP_MODE', payload: m.key })}
              title={m.title}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mapMode === m.key
                  ? 'bg-surface-3 text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Right actions (only in gap) */}
      {!isSci ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_LIVE' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              liveMode
                ? 'bg-accent/15 text-accent border-accent/40'
                : 'bg-surface border-surface-3 text-muted hover:text-foreground'
            }`}
          >
            {liveMode && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
            En vivo
          </button>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIMULATOR' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              simulatorActive
                ? 'bg-accent text-white border-accent'
                : 'bg-surface border-surface-3 text-muted hover:text-foreground'
            }`}
          >
            Simular
          </button>
        </div>
      ) : (
        <div className="text-xs text-muted font-display tracking-wide">
          Sistema de Comando de Incidentes
        </div>
      )}
    </motion.header>
  )
}
