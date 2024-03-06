import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Image } from '#types/image'

export const views: Views<Image> = {
  bySourcesCount: {
    map: doc => {
      if (doc.sources != null) {
        emit(-doc.sources.length, null)
      }
    },
  },
}
