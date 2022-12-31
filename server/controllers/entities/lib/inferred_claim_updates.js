// Infer entity updates from other entity updates
// Ex: see if a work label should be updated after one of its editions
// got it's title updated

import getEntityType from './get_entity_type'

import keepWorkLabelAndEditionTitleInSync from './keep_work_label_and_edition_title_in_sync'

export default (updatedDoc, property, oldVal) => {
  const type = getEntityType(updatedDoc.claims['wdt:P31'])
  if (type === 'edition') {
    if (property === 'wdt:P1476') {
      return keepWorkLabelAndEditionTitleInSync(updatedDoc, oldVal)
    }
  }
}
