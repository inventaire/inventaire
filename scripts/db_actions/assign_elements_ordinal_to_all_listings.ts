#!/usr/bin/env tsx
// Temporary updater for assigning elements `ordinal` to elements documents which do not have one
import { compact, property, sortBy } from 'lodash-es'
import { getElementsByListings } from '#controllers/listings/lib/elements'
import dbFactory from '#db/couchdb/base'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { updateElementDoc } from '#models/element'
import { shellExec } from '#scripts/scripts_utils'
import config from '#server/config'

const dbBaseUrl = config.db.getOrigin()

const assignElementsOrdinalToAllListings = async () => {
  const getAllListingsIdsCurlCommand = `curl -H 'Content-Type:application/json' -H 'Accept: application/json' '${dbBaseUrl}/${config.db.name('lists')}/_all_docs?include_docs=true' | jq  '.rows[] | .doc._id' | jq -s`
  const { stdout } = await shellExec(getAllListingsIdsCurlCommand)
  const allListingsIds = JSON.parse(stdout).slice(0, -2) // remove last array item `"_design/lists"`
  await addListingsOrdinals(allListingsIds)
  process.exit(0)
}

function areSomeWithoutOrdinal (elements) {
  return elements.find(el => (typeof (el.ordinal) === 'undefined'))
}

async function updateOrdinals (elements) {
  const orderedUris = elements.map(property('uri'))
  return reorderElements(orderedUris, elements)
}

const addListingOrdinals = async listingId => {
  const elements = await getElementsByListings([ listingId ])
  if (isNonEmptyArray(elements)) {
    if (areSomeWithoutOrdinal(elements)) {
      // Just making sure
      const sortedElements = sortBy(elements, 'created')
      console.log('updating listing:', listingId)
      return updateOrdinals(sortedElements)
    }
  }
}

async function addListingsOrdinals (listingsIds) {
  const remainingListingsIds = listingsIds.slice(0) // clone
  const nextBatch = async () => {
    // One by one since, updating all elements from a listing may be heavy
    const batchListingsIds = remainingListingsIds.splice(0, 1)
    if (batchListingsIds.length === 0) return
    await Promise.all(compact(batchListingsIds.map(addListingOrdinals)))
    // Give couchdb some rest
    // await wait(1000)
    return nextBatch()
  }
  await nextBatch()
}

// Do not reuse reorderElements from controllers/listings/lib/elements.ts to be able to also update elements without ordinal. See reorderAndUpdateDocs below
const db = await dbFactory('elements')

export async function reorderElements (uris, currentElements) {
  const docsToUpdate = reorderAndUpdateDocs({
    updateDocFn: updateElementDoc,
    newOrderedKeys: uris,
    currentDocs: currentElements,
    attributeToSortBy: 'uri',
    indexKey: 'ordinal',
  })
  if (docsToUpdate.length > 0) {
    await db.bulk(docsToUpdate)
  }
}

function reorderAndUpdateDocs ({ updateDocFn, newOrderedKeys, currentDocs, attributeToSortBy, indexKey }) {
  const docsToUpdate = []
  for (let i = 0; i < newOrderedKeys.length; i++) {
    const currentDoc = currentDocs.find(el => el[attributeToSortBy] === newOrderedKeys[i])
    // Next line is different than in reorderAndUpdateDocs
    // to be able to assign new `ordinal` key
    if (currentDoc[indexKey] === undefined || currentDoc[indexKey] !== i) {
      const newAttributes = {}
      newAttributes[indexKey] = i
      docsToUpdate.push(updateDocFn(newAttributes, currentDoc, currentDocs))
    }
  }
  return docsToUpdate
}

assignElementsOrdinalToAllListings()
