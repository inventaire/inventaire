import { someReference } from '#fixtures/entities'
import { createBlankEntityDoc } from '#models/entity'
import type { CouchRevId, CouchUuid } from '#server/types/couchdb'
import type { InvEntity } from '#server/types/entity'

export function workDoc () {
  const doc: InvEntity = Object.assign(createBlankEntityDoc(), {
    _id: '12345678900987654321123456789012' as CouchUuid,
    _rev: '5-12345678900987654321123456789012' as CouchRevId,
    created: Date.now(),
    updated: Date.now(),
  })
  doc.claims['wdt:P31'] = [ 'wd:Q47461344' ]
  doc.claims['wdt:P50'] = [ 'wd:Q535', 'wd:Q1541' ]
  doc.claims['wdt:P144'] = [ { value: 'wd:Q150827', references: [ someReference ] }, 'wd:Q29478' ]
  return doc
}
