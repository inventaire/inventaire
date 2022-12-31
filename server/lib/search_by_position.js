import _ from 'builders/utils'
import { buildSearcher } from 'lib/elasticsearch'
import assert_ from 'lib/utils/assert_types'

export default (db, dbBaseName) => {
  const searchByPosition = buildSearcher({
    dbBaseName,
    queryBuilder
  })

  return async bbox => {
    assert_.numbers(bbox)
    const hits = await searchByPosition(bbox)
    const ids = _.map(hits, '_id')
    return db.byIds(ids)
  }
}

// See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-bounding-box-query.html
const queryBuilder = ([ minLng, minLat, maxLng, maxLat ]) => {
  const topLeft = { lat: maxLat, lon: minLng }
  const bottomRight = { lat: minLat, lon: maxLng }
  return {
    query: {
      bool: {
        filter: {
          geo_bounding_box: {
            position: {
              top_left: topLeft,
              bottom_right: bottomRight
            }
          }
        }
      }
    },
    size: 500
  }
}
