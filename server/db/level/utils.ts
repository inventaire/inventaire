import type { CustomLevelDb } from '#db/level/get_sub_db'
import { forceArray } from '#lib/utils/base'

export const formatBatchOps = ops => forceArray(ops).map(setDefaultType)

// Levelup rejects `null` or `undefined` values, so the empty value should
// be an empty string.
// Useful when the key alone stores all the data that needs to be stored
export const emptyValue = ''

function setDefaultType (operation) {
  operation.type = operation.type || 'put'
  return operation
}

export async function getKeys (db: CustomLevelDb) {
  return getStreamPromise(db.createKeyStream()) as Promise<string[]>
}

function getStreamPromise (stream) {
  return new Promise((resolve, reject) => {
    const results = []
    return stream
    .on('data', results.push.bind(results))
    .on('end', () => resolve(results))
    .on('error', reject)
  })
}
