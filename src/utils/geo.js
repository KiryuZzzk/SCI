import centroid from '@turf/centroid'
import distance from '@turf/distance'
import nearestPoint from '@turf/nearest-point'
import buffer from '@turf/buffer'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import pointsWithinPolygon from '@turf/points-within-polygon'
import { point, featureCollection } from '@turf/helpers'

/**
 * Get the centroid of a GeoJSON polygon feature as [lat, lng].
 */
export function getColoniaCentroid(coloniaFeature) {
  const c = centroid(coloniaFeature)
  return c.geometry.coordinates // [lng, lat]
}

/**
 * Distance in km between two [lng, lat] coordinate pairs.
 */
export function distanceKm(coordA, coordB) {
  return distance(point(coordA), point(coordB), { units: 'kilometers' })
}

/**
 * Find the nearest resource to a given [lng, lat] point.
 * resources: array of { lat, lng, ...rest }
 * Returns { resource, distanceKm }
 */
export function findNearest(coordLngLat, resources) {
  if (!resources || resources.length === 0) return null

  const pts = featureCollection(
    resources.map((r, i) =>
      Object.assign(point([r.lng, r.lat]), { properties: { index: i } })
    )
  )
  const target = point(coordLngLat)
  const nearest = nearestPoint(target, pts)
  const idx = nearest.properties.index
  const dist = nearest.properties.distanceToPoint

  return {
    resource: resources[idx],
    distanceKm: dist,
  }
}

/**
 * Count resources within radiusKm of a [lng, lat] centroid.
 */
export function countWithinRadius(coordLngLat, resources, radiusKm) {
  if (!resources || resources.length === 0) return 0
  const buf = buffer(point(coordLngLat), radiusKm, { units: 'kilometers' })
  const pts = featureCollection(
    resources.map((r) => point([r.lng, r.lat]))
  )
  const inside = pointsWithinPolygon(pts, buf)
  return inside.features.length
}

/**
 * Check if a [lng, lat] coordinate is within a GeoJSON polygon feature.
 */
export function isPointInPolygon(coordLngLat, polygonFeature) {
  return booleanPointInPolygon(point(coordLngLat), polygonFeature)
}
