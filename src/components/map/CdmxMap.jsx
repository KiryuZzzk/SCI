import { useCallback } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { useAppContext } from '../../context/AppContext.jsx'
import { CDMX_CENTER, CDMX_ZOOM, TILE_URL, CDMX_BOUNDS } from '../../constants/mapConfig.js'
import AlcaldiaLayer from './AlcaldiaLayer.jsx'
import ColoniaLayer from './ColoniaLayer.jsx'
import ResourceMarkers from './ResourceMarkers.jsx'
import HeatmapLayer from './HeatmapLayer.jsx'
import LiveUnitsLayer from './LiveUnitsLayer.jsx'
import LiveIncidentsLayer from './LiveIncidentsLayer.jsx'
import SimulatorMarker from '../simulator/SimulatorMarker.jsx'
import MapLegend from './MapLegend.jsx'
import SimulatorToolbar from '../simulator/SimulatorToolbar.jsx'
import LiveSimPanel from '../panels/LiveSimPanel.jsx'
import useGapScore from '../../hooks/useGapScore.js'
import useLiveSimulation from '../../hooks/useLiveSimulation.js'
// SCI layers
import SciResourcesLayer from '../sci/map/SciResourcesLayer.jsx'
import SciIncidentsLayer from '../sci/map/SciIncidentsLayer.jsx'
import SciZonesLayer from '../sci/map/SciZonesLayer.jsx'
import SciClickCatcher from '../sci/map/SciClickCatcher.jsx'

export default function CdmxMap({ onColoniaClick }) {
  const { state } = useAppContext()
  const {
    colonias, alcaldias, incidents, hospitals, fireStations,
    activeTypes, hypothetical, mapMode, simulatorActive,
    liveMode, liveSpeed, appMode,
  } = state

  const { scores, summary } = useGapScore({
    colonias, incidents, hospitals, fireStations, activeTypes, hypothetical,
  })

  const { units, incidents: liveIncidents, log, reset } = useLiveSimulation(liveMode, liveSpeed)

  return (
    <div className="absolute inset-0 pt-10">
      <MapContainer
        center={CDMX_CENTER}
        zoom={CDMX_ZOOM}
        maxBounds={CDMX_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        className="w-full h-full"
        preferCanvas
      >
        <TileLayer
          url={TILE_URL}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />

        {alcaldias && appMode !== 'sci' && <AlcaldiaLayer alcaldias={alcaldias} />}

        {/* BRECHA — colonias coloreadas por déficit de cobertura + marcadores de recursos */}
        {colonias && appMode !== 'sci' && mapMode === 'gap' && (
          <ColoniaLayer
            colonias={colonias}
            scores={scores}
            mapMode={mapMode}
            onColoniaClick={onColoniaClick}
          />
        )}
        {appMode !== 'sci' && mapMode === 'gap' && hospitals && fireStations && (
          <ResourceMarkers hospitals={hospitals} fireStations={fireStations} hypothetical={hypothetical} />
        )}

        {/* CALOR — densidad de incidentes históricos */}
        {colonias && appMode !== 'sci' && mapMode === 'heatmap' && incidents && (
          <HeatmapLayer colonias={colonias} incidents={incidents} activeTypes={activeTypes} />
        )}

        {/* RECURSOS — solo marcadores, mapa limpio para ver distribución */}
        {appMode !== 'sci' && mapMode === 'resources' && hospitals && fireStations && (
          <ResourceMarkers hospitals={hospitals} fireStations={fireStations} hypothetical={hypothetical} />
        )}

        {simulatorActive && hypothetical.map(h => (
          <SimulatorMarker key={h.id} resource={h} />
        ))}

        {liveMode && <LiveUnitsLayer units={units} />}
        {liveMode && <LiveIncidentsLayer incidents={liveIncidents} />}

        {/* SCI mode layers — rendered inside MapContainer so they have map context */}
        {appMode === 'sci' && <SciResourcesLayer />}
        {appMode === 'sci' && <SciIncidentsLayer />}
        {appMode === 'sci' && <SciZonesLayer />}
        {appMode === 'sci' && <SciClickCatcher />}
      </MapContainer>

      {appMode === 'gap' && !liveMode && <MapLegend mapMode={mapMode} summary={summary} />}
      {appMode === 'gap' && simulatorActive && <SimulatorToolbar />}
      {appMode === 'gap' && liveMode && (
        <LiveSimPanel units={units} incidents={liveIncidents} log={log} onReset={reset} />
      )}
    </div>
  )
}
