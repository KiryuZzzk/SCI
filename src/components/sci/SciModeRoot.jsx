import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../context/AppContext.jsx'
import { SciSimulationDriver } from '../../hooks/useSciSimulation.js'
import { autosaveSci, loadAutosave } from '../../utils/sciPersistence.js'

import SciTopBar from './panels/SciTopBar.jsx'
import SciSidebar from './panels/SciSidebar.jsx'
import SciUnitDetailPanel from './panels/SciUnitDetailPanel.jsx'
import SciIncidentPanel from './panels/SciIncidentPanel.jsx'
import SciIncidentCreator from './modals/SciIncidentCreator.jsx'
import SciAutoScenarioModal from './modals/SciAutoScenarioModal.jsx'
import SciExportModal from './modals/SciExportModal.jsx'
import SciFormsModal  from './modals/SciFormsModal.jsx'
import SciScenarioMenu from './panels/SciScenarioMenu.jsx'
import SciRestoreBanner from './panels/SciRestoreBanner.jsx'
import SciCommandPalette from './panels/SciCommandPalette.jsx'
import SciDashboard from './panels/SciDashboard.jsx'
import SciOnboarding from './panels/SciOnboarding.jsx'
import SciPresentation from './panels/SciPresentation.jsx'
import SciTimeline from './panels/SciTimeline.jsx'
import SciGuideRail from './panels/SciGuideRail.jsx'
import { HelpCircle } from 'lucide-react'

export default function SciModeRoot() {
  const { state, dispatch } = useAppContext()
  const { sci } = state
  const [autoModalOpen,   setAutoModalOpen]   = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [formsModalOpen,  setFormsModalOpen]  = useState(false)
  const [formsIncidentId, setFormsIncidentId] = useState(null)
  const [paletteOpen,     setPaletteOpen]     = useState(false)
  const [dashboardOpen,   setDashboardOpen]   = useState(false)
  const [onboardOpen,     setOnboardOpen]     = useState(false)
  const [presentOpen,     setPresentOpen]     = useState(false)
  const [timelineOpen,    setTimelineOpen]    = useState(false)
  const [detailOpen,      setDetailOpen]      = useState(false)
  const [pendingRestore,  setPendingRestore]  = useState(null)
  // Sidebar tab override — timestamp forces re-trigger even if same tab
  const [sidebarForcedTab, setSidebarForcedTab] = useState(null)

  // Detectar autosave previo al montar (una vez)
  const checkedRef = useRef(false)
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true
    const saved = loadAutosave()
    if (saved && saved.sci.incidents?.length > 0) {
      setPendingRestore(saved) // eslint-disable-line react-hooks/set-state-in-effect
    }
    // Onboarding primera vez
    try {
      if (!localStorage.getItem('sci_onboarding_seen')) {
        setOnboardOpen(true)
        localStorage.setItem('sci_onboarding_seen', '1')
      }
    } catch { /* noop */ }
  }, [])

  // Autosave debounced en cada cambio del slice sci
  useEffect(() => {
    if (!sci.resourceLoaded) return
    autosaveSci(sci)
  }, [sci])

  // Atajos globales: Cmd/Ctrl+K → palette · D → dashboard · ESC → cerrar dashboard
  useEffect(() => {
    const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
        return
      }
      if (isTyping(e.target)) return
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setDashboardOpen(o => !o)
      } else if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setPresentOpen(o => !o)
      } else if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setTimelineOpen(o => !o)
      } else if (e.key === 'Escape') {
        setDashboardOpen(false)
        setTimelineOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Simulation tick driver */}
      <SciSimulationDriver state={state} dispatch={dispatch} />

      {/* Top control bar */}
      <SciTopBar
        onOpenAutoModal={() => setAutoModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenForms={() => { setFormsIncidentId(null); setFormsModalOpen(true) }}
        onOpenDashboard={() => setDashboardOpen(true)}
      />

      {/* Left sidebar — tabbed: Recursos | Incidentes | Registro */}
      <SciSidebar
        onOpenExport={() => setExportModalOpen(true)}
        forcedTab={sidebarForcedTab}
      />

      {/* Right side — Guía SCI persistente (default) / detalle bajo demanda */}
      <AnimatePresence mode="wait">
        {sci.selectedResourceId != null ? (
          <SciUnitDetailPanel key="unit-panel" />
        ) : detailOpen && sci.selectedIncidentId != null ? (
          <SciIncidentPanel
            key="incident-panel"
            onClose={() => setDetailOpen(false)}
            onOpenForms={(id) => { setFormsIncidentId(id); setFormsModalOpen(true) }}
          />
        ) : (
          <SciGuideRail
            key="guide-rail"
            onOpenDetail={() => setDetailOpen(true)}
            onCreateIncident={() => dispatch({ type: 'SCI_START_CREATION' })}
            onShowResources={() => setSidebarForcedTab('recursos_' + Date.now())}
          />
        )}
      </AnimatePresence>

      {/* Scenario menu (snapshots / export / import) */}
      <SciScenarioMenu />

      {/* Restore banner — aparece si hay autosave previo */}
      <AnimatePresence>
        {pendingRestore && (
          <SciRestoreBanner
            savedAt={pendingRestore.savedAt}
            incidentCount={pendingRestore.sci.incidents?.length ?? 0}
            onRestore={() => {
              dispatch({ type: 'SCI_RESTORE', payload: pendingRestore.sci })
              setPendingRestore(null)
            }}
            onDismiss={() => setPendingRestore(null)}
          />
        )}
      </AnimatePresence>

      {/* Command palette (Cmd/Ctrl+K) */}
      <SciCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenAutoModal={() => setAutoModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenForms={() => { setFormsIncidentId(null); setFormsModalOpen(true) }}
        onOpenDashboard={() => setDashboardOpen(true)}
        onStartPresentation={() => setPresentOpen(true)}
        onOpenTimeline={() => setTimelineOpen(true)}
      />

      {/* Dashboard sala de monitoreo (tecla D) */}
      <SciDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} />

      {/* Onboarding tour */}
      <SciOnboarding open={onboardOpen} onClose={() => setOnboardOpen(false)} />

      {/* Modo presentación (tecla P) */}
      <SciPresentation
        open={presentOpen}
        onClose={() => setPresentOpen(false)}
        onOpenDashboard={() => setDashboardOpen(true)}
      />

      {/* Línea de tiempo / debrief (tecla T) */}
      <SciTimeline open={timelineOpen} onClose={() => setTimelineOpen(false)} />

      {/* Botón ayuda — reabre el tour */}
      <button
        onClick={() => setOnboardOpen(true)}
        title="Ayuda / tour"
        className="absolute bottom-4 right-16 z-[850] w-9 h-9 rounded-full bg-[#0c1520]/97 backdrop-blur-md border border-slate-700/50 shadow-xl text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors flex items-center justify-center"
      >
        <HelpCircle size={16} strokeWidth={2} />
      </button>

      {/* Modals */}
      <SciIncidentCreator />
      <SciAutoScenarioModal open={autoModalOpen}   onClose={() => setAutoModalOpen(false)} />
      <SciExportModal       open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
      <SciFormsModal
        open={formsModalOpen}
        onClose={() => setFormsModalOpen(false)}
        preselectedIncidentId={formsIncidentId}
      />
    </>
  )
}
