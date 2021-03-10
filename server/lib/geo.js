const assert_ = require('lib/utils/assert_types')

// Distance between LatLng
// adapted from Leaflet distanceTo
const distanceBetween = (latLngA, latLngB) => {
  const [ latA, lngA ] = latLngA
  const [ latB, lngB ] = latLngB

  if (latA === latB && lngA === lngB) return 0

  const dLat = (latB - latA) * d2r
  const dLon = (lngB - lngA) * d2r
  const lat1 = lngA * d2r
  const lat2 = latB * d2r
  const sin1 = Math.sin(dLat / 2)
  const sin2 = Math.sin(dLon / 2)

  const a = (sin1 * sin1) + (sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2))

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// earth radius in meters
const R = 6378137
// DEG_TO_RAD
const d2r = Math.PI / 180

module.exports = {
  distanceBetween,

  kmBetween: (latLngA, latLngB) => {
    assert_.arrays([ latLngA, latLngB ])
    const meters = distanceBetween(latLngA, latLngB)
    // 1km precision above 10km
    if (meters > 10000) {
      return Math.trunc(meters / 1000)
    // 100m precision under
    } else {
      return Math.trunc(meters / 100) / 10
    }
  },

  truncateLatLng: latLng => latLng != null ? latLng.map(truncateDecimals) : null
}

// Coordinates are in decimal degrees
// There is no need to keep more than 5 decimals, cf https://xkcd.com/2170/
const truncateDecimals = degree => Math.round(degree * 100000) / 100000
