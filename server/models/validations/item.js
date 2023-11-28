import { isArray, isString } from 'lodash-es'
import { isExtendedUrl, isLang } from '#lib/boolean_validations'
import { isVisibilityKeyArray } from '#models/validations/visibility'
import itemAttributes from '../attributes/item.js'
import commonValidations from './common.js'

const { pass, itemId, userId, entityUri, BoundedString, imgUrl } = commonValidations
const { constrained } = itemAttributes
const constrainedAttributes = Object.keys(constrained)

export default {
  pass,
  itemId,
  userId,
  entity: entityUri,
  lang: lang => lang ? isLang(lang) : true,
  pictures: pictures => isArray(pictures) && pictures.every(imgUrl),
  attribute: attribute => constrainedAttributes.includes(attribute),
  transaction: transaction => {
    return constrained.transaction.possibilities.includes(transaction)
  },
  visibility: isVisibilityKeyArray,
  details: isString,
  notes: isString,
  snapshotValidations: {
    'entity:title': BoundedString(1, 500),
    'entity:image': isExtendedUrl,
    'entity:lang': isLang,
    'entity:authors': isString,
    'entity:series': isString,
    'entity:ordinal': isString,
  },
}
