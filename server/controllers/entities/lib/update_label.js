import _ from '#builders/utils'
import error_ from '#lib/error/error'
import Entity from '#models/entity'
import { emit } from '#lib/radio'
import entities_ from './entities.js'
import getEntityType from './get_entity_type.js'
import typeWithoutLabels from './type_without_labels.js'

export default async (lang, value, userId, currentDoc) => {
  checkEntityTypeCanHaveLabel(currentDoc)

  let updatedDoc = _.cloneDeep(currentDoc)
  updatedDoc = Entity.setLabel(updatedDoc, lang, value)
  const docAfterUpdate = await entities_.putUpdate({ userId, currentDoc, updatedDoc })
  await emit('entity:update:label', updatedDoc)
  return docAfterUpdate
}

const checkEntityTypeCanHaveLabel = currentDoc => {
  const type = getEntityType(currentDoc.claims['wdt:P31'])

  if (typeWithoutLabels[type]) {
    throw error_.new(`${type}s can't have labels`, 400)
  }
}
