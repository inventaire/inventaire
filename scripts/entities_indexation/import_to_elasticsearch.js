#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const type = process.argv.slice(2)[0]
const split = require('split')
const { indexedEntitiesTypes } = __.require('controllers', 'search/lib/indexes')

if (type == null || !indexedEntitiesTypes.includes(type)) {
  throw new Error(`invalid type: ${type}\nValid types: ${indexedEntitiesTypes.join(', ')}`)
}

const { removeTrailingComma, isJsonLine, logCount } = __.require('controllers', 'entities/lib/indexation/helpers')
const formatEntities = __.require('controllers', 'entities/lib/indexation/format_entities')(type)
const bulkPost = __.require('controllers', 'entities/lib/indexation/bulk_post_to_elasticsearch')

const haveSpecialImagesGetter = __.require('controllers', 'entities/lib/indexation/have_special_images_getter')
const batchLength = haveSpecialImagesGetter.includes(type) ? 100 : 1000

const lineStream = process.stdin.pipe(split())

let entitiesBatch = []
let lineCount = 0
const onLine = line => {
  lineCount++
  // ignore empty lines
  if ((line === '') || (line === '[') || (line === ']')) return

  line = removeTrailingComma(line)

  // discard invalid lines
  if (!isJsonLine(line)) {
    _.error(`invalid line: ${lineCount}`, line)
    return
  }

  entitiesBatch.push(JSON.parse(line))
  if (entitiesBatch.length >= batchLength) formatAndPutCurrentBatch()
  return logCount(lineCount)
}

const formatAndPutCurrentBatch = () => {
  let currentBatch
  _.success(entitiesBatch.length, 'putting batch...');
  [ currentBatch, entitiesBatch ] = [ entitiesBatch, [] ]

  // Pause to limit the amount of concurrent batches being formatted to one
  lineStream.pause()

  return formatAndPutBatch(currentBatch)
  .then(() => lineStream.resume())
  .catch(_.Error('formatAndPutBatch err body'))
}

const formatAndPutBatch = batch => {
  return formatEntities(batch)
  .then(formattedEntities => bulkPost(type, formattedEntities))
}

const done = () => {
  return formatAndPutBatch(entitiesBatch)
  .then(() => _.success('done!'))
}

lineStream
.on('data', onLine)
.on('error', _.Error('stream error'))
.on('close', done)
