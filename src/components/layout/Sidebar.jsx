import { motion, AnimatePresence } from 'framer-motion'
import { MdClose } from 'react-icons/md'
import { useAppContext } from '../../context/AppContext.jsx'
import { EASE_OUT_EXPO, SPRING_SIDEBAR } from '../../constants/colors.js'
import ColoniaDetail from '../panels/ColoniaDetail.jsx'
import FilterPanel from '../panels/FilterPanel.jsx'
import StatsOverview from '../panels/StatsOverview.jsx'
import useGapScore from '../../hooks/useGapScore.js'

export default function Sidebar() {
  const { state, dispatch } = useAppContext()
  const { sidebarOpen, selectedColonia, colonias, incidents, hospitals, fireStations, activeTypes, hypothetical } = state

  const { scores, summary } = useGapScore({
    colonias, incidents, hospitals, fireStations, activeTypes, hypothetical,
  })

  return (
    <>
      {/* Filter panel — always visible on the right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.2 }}
        className="absolute top-12 right-4 z-[1000] w-64 space-y-3"
      >
        <StatsOverview summary={summary} />
        <FilterPanel />
      </motion.div>

      {/* Colonia detail — slides in from left */}
      <AnimatePresence>
        {sidebarOpen && selectedColonia && (
          <motion.aside
            key="colonia-detail"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', ...SPRING_SIDEBAR }}
            className="absolute top-10 left-0 bottom-0 z-[1000] w-80 bg-bg/90 backdrop-blur-md border-r border-surface-3 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-3">
              <h2 className="text-foreground font-display font-semibold text-sm truncate pr-2">
                {selectedColonia.properties?.NOMGEO || selectedColonia.properties?.CVE_GEO}
              </h2>
              <button
                onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
                className="text-muted hover:text-foreground transition-colors flex-shrink-0"
              >
                <MdClose size={18} />
              </button>
            </div>

            <ColoniaDetail
              cveGeo={selectedColonia.cveGeo}
              properties={selectedColonia.properties}
              scores={scores}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
