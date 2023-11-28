import { map } from 'lodash-es'
import { buildSearcher } from '#lib/elasticsearch'
import { assert_ } from '#lib/utils/assert_types'

export default (db, dbBaseName) => {
  const searchByPosition = buildSearcher({
    dbBaseName,
    queryBuilder,
  })

  return async bbox => {
    assert_.numbers(bbox)
    const { hits } = await searchByPosition(bbox)
    const ids = map(hits, '_id')
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
  if (minLng < -180 && maxLng > -180) {
    return [
      [ -180, minLat, maxLng, maxLat ],
      [ normalizeLongitude(minLng), minLat, 180, maxLat ],
    ]
  } else if (maxLng > 180 && minLng < 180) {
    return [
      [ minLng, minLat, 180, maxLat ],
      [ -180, minLat, normalizeLongitude(maxLng), maxLat ],
    ]
  } else {
    return [
      // Normalizing for the case where both minLng and maxLng are out of the [ -180, 180 ] range
      [ normalizeLongitude(minLng), minLat, normalizeLongitude(maxLng), maxLat ],
    ]
  }
}

const normalizeLongitude = lng => {
  if (lng < -180) return lng + 360
  if (lng > 180) return lng - 360
  return lng
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
