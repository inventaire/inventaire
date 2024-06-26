import type { DbInfo } from '#db/couchdb/base'
import { setDocsDeletedTrue } from '#lib/couch'
import { assert_ } from '#lib/utils/assert_types'
import { forceArray } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import type getDbApi from './cot_base.js'

export function couchdbBundlesFactory (db: ReturnType<typeof getDbApi> & DbInfo) {
  function actionAndReturn (verb: string, doc) {
    assert_.object(doc)
    return db[verb](doc)
    .then(updateIdAndRev.bind(null, doc))
  }

  async function bulkDelete (docs) {
    assert_.objects(docs)
    if (docs.length === 0) return []
    warn(docs, `${db.dbName} bulkDelete`)
    return db.bulk(setDocsDeletedTrue(docs))
  }

  return {
    byIds: async <D>(ids: string[]) => {
      ids = forceArray(ids)
      const { docs } = await db.fetch<D>(ids)
      return docs
    },
    postAndReturn: actionAndReturn.bind(null, 'post'),
    putAndReturn: actionAndReturn.bind(null, 'put'),
    bulkDelete,
  }
}

function updateIdAndRev (doc, couchRes) {
  if (!doc._id) doc._id = couchRes.id
  doc._rev = couchRes.rev
  return doc
}
