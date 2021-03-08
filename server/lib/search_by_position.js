const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { buildSearcher } = __.require('lib', 'elasticsearch')
const assert_ = __.require('lib', 'utils/assert_types')

module.exports = (db, dbBaseName) => {
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
