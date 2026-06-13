import { useReducer, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import AppContext from './context/AppContext.jsx'
import { appReducer, initialState } from './context/appReducer.js'
import LoadingScreen from './components/layout/LoadingScreen.jsx'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import CdmxMap from './components/map/CdmxMap.jsx'
import SciModeRoot from './components/sci/SciModeRoot.jsx'
import useDataLoader from './hooks/useDataLoader.js'

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const { loading, progress, error } = useDataLoader(dispatch)

  const handleColoniaClick = useCallback((cveGeo, properties) => {
    dispatch({ type: 'SELECT_COLONIA', payload: { cveGeo, properties } })
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-foreground">
        <div className="text-center space-y-3">
          <p className="text-accent text-lg font-display font-semibold">Error al cargar datos</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="relative w-screen h-screen bg-bg" style={{ overflow: 'clip' }}>
        <AnimatePresence>
          {loading && <LoadingScreen key="loading" progress={progress} />}
        </AnimatePresence>

        {!loading && (
          <>
            <Header />
            <CdmxMap onColoniaClick={handleColoniaClick} />
            {state.appMode === 'gap' && <Sidebar />}
            {state.appMode === 'sci' && <SciModeRoot />}
          </>
        )}
      </div>
    </AppContext.Provider>
  )
}
