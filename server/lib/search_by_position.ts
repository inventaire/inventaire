import { map } from 'lodash-es'
import { buildSearcher } from '#lib/elasticsearch'
import { assert_ } from '#lib/utils/assert_types'
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types.js'

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

function queryBuilder ([ minLng, minLat, maxLng, maxLat ]) {
  const bboxes = splitBboxOnAntiMeridian([ minLng, minLat, maxLng, maxLat ])
  const searchRequest: SearchRequest = {
    query: {
      // @ts-ignore somehow, the "should" assertion library is leaking global types
      // defined in node_modules/should/should.d.ts, which conflict with ES types here
      // (Using ts-ignore instead of ts-expect error, as the build doesn't find the same error)
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
  return searchRequest
}

function splitBboxOnAntiMeridian ([ minLng, minLat, maxLng, maxLat ]) {
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

function normalizeLongitude (lng) {
  if (lng < -180) return lng + 360
  if (lng > 180) return lng - 360
  return lng
}

function buildGeoBoundingBoxClause ([ minLng, minLat, maxLng, maxLat ]) {
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
