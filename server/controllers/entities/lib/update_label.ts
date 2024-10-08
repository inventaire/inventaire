import { cloneDeep } from 'lodash-es'
import { putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { setEntityDocLabel } from '#models/entity'
import { getInvEntityType } from './get_entity_type.js'
import { typeWithoutLabels } from './type_without_labels.js'

export default async function (lang, value, userId, currentDoc) {
  checkEntityTypeCanHaveLabel(currentDoc)

  let updatedDoc = cloneDeep(currentDoc)
  updatedDoc = setEntityDocLabel(updatedDoc, lang, value)
  const docAfterUpdate = await putInvEntityUpdate({ userId, currentDoc, updatedDoc })
  await emit('entity:update:label', updatedDoc)
  return docAfterUpdate
}

function checkEntityTypeCanHaveLabel (currentDoc) {
  const type = getInvEntityType(currentDoc.claims['wdt:P31'])

  if (typeWithoutLabels.has(type)) {
    throw newError(`${type}s can't have labels`, 400)
  }
}
