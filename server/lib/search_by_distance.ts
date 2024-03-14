import { buildSearcher } from '#lib/elasticsearch'
import { distanceBetween } from '#lib/geo'
import { assert_ } from '#lib/utils/assert_types'
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types.js'

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
  const searchRequest: SearchRequest = {
    query: {
      // @ts-ignore somehow, the "should" assertion library is leaking global types
      // defined in node_modules/should/should.d.ts, which conflict with ES types here
      // (Using ts-ignore instead of ts-expect error, as the build doesn't find the same error)
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
  return searchRequest
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
