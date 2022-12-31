import _ from 'builders/utils'
import error_ from 'lib/error/error'
import entities_ from './entities'
import Entity from 'models/entity'
import getEntityType from './get_entity_type'
import typeWithoutLabels from './type_without_labels'
import { emit } from 'lib/radio'

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
