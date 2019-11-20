const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')

module.exports = {
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
  }
}

// Distance between LatLng
// adapted from Leaflet distanceTo
const distanceBetween = (latLngA, latLngB) => {
  const [ latA, lngA ] = Array.from(latLngA)
  const [ latB, lngB ] = Array.from(latLngB)
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
