import { map } from 'lodash-es'
import { buildSearcher } from '#lib/elasticsearch'
import { assertNumbers } from '#lib/utils/assert_types'
import type { BBox, Bounds } from '#types/common'
import type { DbHandler } from '#types/couchdb'
import type { User } from '#types/user'
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types.js'

export function searchByPositionFactory <D extends User> (db: DbHandler, dbBaseName: string) {
  const searchByPosition = buildSearcher({
    dbBaseName,
    queryBuilder,
  })

  return async (bbox: BBox, limit: number = 500) => {
    assertNumbers(bbox)
    const { hits } = await searchByPosition(bbox)
    const limitedHits = hits.slice(0, limit)
    const ids = map(limitedHits, '_id')
    return db.byIds<D>(ids)
  }
}

function queryBuilder (bounds: Bounds) {
  const boundss: Bounds[] = splitBboxOnAntiMeridian(bounds)
  const searchRequest: SearchRequest = {
    query: {
      // @ts-ignore somehow, the "should" assertion library is leaking global types
      // defined in node_modules/should/should.d.ts, which conflict with ES types here
      // (Using ts-ignore instead of ts-expect error, as the build doesn't find the same error)
      bool: {
        filter: {
          bool: {
            should: boundss.map(buildGeoBoundingBoxClause),
          },
        },
      },
    },
    size: 500,
  }
  return searchRequest
}

function splitBboxOnAntiMeridian ([ minLng, minLat, maxLng, maxLat ]: Bounds) {
  if (minLng < -180 && maxLng > -180) {
    return [
      [ -180, minLat, maxLng, maxLat ],
      [ normalizeLongitude(minLng), minLat, 180, maxLat ],
    ] as Bounds[]
  } else if (maxLng > 180 && minLng < 180) {
    return [
      [ minLng, minLat, 180, maxLat ],
      [ -180, minLat, normalizeLongitude(maxLng), maxLat ],
    ] as Bounds[]
  } else {
    return [
      // Normalizing for the case where both minLng and maxLng are out of the [ -180, 180 ] range
      [ normalizeLongitude(minLng), minLat, normalizeLongitude(maxLng), maxLat ],
    ] as Bounds[]
  }
}

function normalizeLongitude (lng: number) {
  if (lng < -180) return lng + 360
  if (lng > 180) return lng - 360
  return lng
}

function buildGeoBoundingBoxClause ([ minLng, minLat, maxLng, maxLat ]: Bounds) {
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
