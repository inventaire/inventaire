import CONFIG from 'config'
import { requests_ } from '#lib/requests'
import { assert_ } from '#lib/utils/assert_types'
import { warn, logError } from '#lib/utils/logs'
import { logBulkRes } from './helpers.js'

const { origin: elasticOrigin } = CONFIG.elasticsearch
const headers = { 'content-type': 'application/x-ndjson' }

export function addToBatch (batch, action, index, doc) {
  if (!doc) return warn('ignore empty doc')
  const { _id } = doc
  assert_.string(_id)
  // Prevent triggering the error
  // 'Field [_id] is a metadata field and cannot be added inside a document.'
  delete doc._id
  batch.push(`{"${action}":{"_index":"${index}","_id":"${_id}"}}`)
  if (action === 'index') batch.push(JSON.stringify(doc))
}

export async function postBatch (batch) {
  if (batch.length === 0) return warn('elasticsearch bulk update: empty batch')
  // It is required to end by a newline break
  const body = batch.join('\n') + '\n'
  try {
    const res = await requests_.post(`${elasticOrigin}/_doc/_bulk`, {
      headers,
      body,
    })
    logBulkRes(res, 'bulk post res')
  } catch (err) {
    logError(err, 'bulk post err')
  }
}
