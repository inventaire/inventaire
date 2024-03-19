import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InvEntityDoc } from '#types/entity'

function normalize (label: string) {
  return label
  .trim()
  .replace(/\s\w\.\s?/g, ' ')
  .replace(/\s\s/g, ' ')
  .toLowerCase()
}

export const views: Views<InvEntityDoc> = {
  findHumansHomonymes: {
    map: [
      normalize,
      function (doc) {
        if (doc.type !== 'entity' || 'redirect' in doc) return

        // Keep only humans
        if (doc.claims == null || doc.claims['wdt:P31'] == null) return
        if (doc.claims['wdt:P31'][0] !== 'wd:Q5') return

        if (doc.labels != null && doc.claims != null) {
          const labelsSet = new Set(Object.values(doc.labels).map(normalize))
          labelsSet.forEach(label => emit(label, null))
        }
      },
    ],
    reduce: '_count',
  },
}
