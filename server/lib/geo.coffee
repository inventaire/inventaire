module.exports =
  kmBetween: (latLngA, latLngB)->
    meters = distanceBetween latLngA, latLngB
    # 1km precision above 10km
    if meters > 10000 then Math.trunc(meters / 1000)
    # 100m precision under
    else Math.trunc(meters / 100) / 10

# Distance between LatLng
# adapted from Leaflet distanceTo
distanceBetween = (latLngA, latLngB)->
  [ latA, lngA ] = latLngA
  [ latB, lngB ] = latLngB
  dLat = (latB - latA) * d2r
  dLon = (lngB - lngA) * d2r
  lat1 = lngA * d2r
  lat2 = latB * d2r
  sin1 = Math.sin(dLat / 2)
  sin2 = Math.sin(dLon / 2)

  a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2)

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

# earth radius in meters
R = 6378137
# DEG_TO_RAD
d2r = Math.PI / 180
