import { buildSearcher } from '#lib/elasticsearch'
import { distanceBetween } from '#lib/geo'
import { assert_ } from '#lib/utils/assert_types'

export default dbBaseName => {
  const searchByDistance = buildSearcher({
    dbBaseName,
    queryBuilder,
  })

  return async (latLng, meterRange) => {
    assert_.numbers(latLng)
    assert_.number(meterRange)
    const { hits } = await searchByDistance({ latLng, meterRange })
    return getIdsSortedByDistance(hits, latLng)
  }
}

// See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-bounding-box-query.html
const queryBuilder = ({ latLng, meterRange }) => {
  const [ lat, lon ] = latLng
  return {
    query: {
      bool: {
        filter: {
          geo_distance: {
            distance: `${meterRange}m`,
            position: { lat, lon },
          },
        },
      },
    },
    size: 500,
  }
}

const getIdsSortedByDistance = (hits, centerLatLng) => {
  return hits
  .map(addDistance(centerLatLng))
  .sort((a, b) => a.distance - b.distance)
  .map(hit => hit._id)
}

const addDistance = centerLatLng => hit => {
  const { lat, lon } = hit.position
  hit.distance = distanceBetween(centerLatLng, [ lat, lon ])
  return hit
}
