import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useAppContext } from '../../../context/AppContext.jsx'

export default function SciClickCatcher() {
  const map = useMap()
  const { state, dispatch } = useAppContext()
  const { creation, zoneCreator } = state.sci

  useEffect(() => {
    const pickingIncident = creation.step === 'pick-point'
    const pickingZone = zoneCreator?.awaitingPoint === true
    if (!pickingIncident && !pickingZone) {
      map.getContainer().style.cursor = ''
      return
    }
    map.getContainer().style.cursor = 'crosshair'

    const onClick = (e) => {
      if (pickingIncident) {
        dispatch({ type: 'SCI_SET_DRAFT_POINT', payload: { lat: e.latlng.lat, lng: e.latlng.lng } })
      } else if (pickingZone) {
        dispatch({
          type: 'SCI_ADD_ZONE',
          payload: {
            type: zoneCreator.type,
            label: zoneCreator.label || '',
            incidentId: zoneCreator.incidentId ?? null,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          },
        })
      }
    }
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
      map.getContainer().style.cursor = ''
    }
  }, [creation.step, zoneCreator, map, dispatch])

  return null
}
