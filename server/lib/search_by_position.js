import _ from '#builders/utils'
import { buildSearcher } from '#lib/elasticsearch'
import { assert_ } from '#lib/utils/assert_types'

export default (db, dbBaseName) => {
  const searchByPosition = buildSearcher({
    dbBaseName,
    queryBuilder,
  })

  return async bbox => {
    assert_.numbers(bbox)
    const hits = await searchByPosition(bbox)
    const ids = _.map(hits, '_id')
    return db.byIds(ids)
  }
}

const queryBuilder = ([ minLng, minLat, maxLng, maxLat ]) => {
  const bboxes = splitBboxOnAntiMeridian([ minLng, minLat, maxLng, maxLat ])
  return {
    query: {
      bool: {
        filter: {
          bool: {
            should: bboxes.map(buildGeoBoundingBoxClause),
          },
        },
      },
    },
    size: 500,
  }
}

const splitBboxOnAntiMeridian = ([ minLng, minLat, maxLng, maxLat ]) => {
  if (minLng < -180) {
    return [
      [ -180, minLat, maxLng, maxLat ],
      [ (360 + minLng), minLat, 180, maxLat ],
    ]
  } else if (maxLng > 180) {
    return [
      [ minLng, minLat, 180, maxLat ],
      [ -180, minLat, (maxLng - 360), maxLat ],
    ]
  } else {
    return [
      [ minLng, minLat, maxLng, maxLat ],
    ]
  }
}

const buildGeoBoundingBoxClause = ([ minLng, minLat, maxLng, maxLat ]) => {
  const topLeft = { lat: maxLat, lon: minLng }
  const bottomRight = { lat: minLat, lon: maxLng }
  return {
    // See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-bounding-box-query.html
    geo_bounding_box: {
      position: {
        top_left: topLeft,
        bottom_right: bottomRight,
      },
    },
  }
}
