import privateAttributesUtilsFactory from '#lib/private_attributes_utils_factory'
import { private as privateAttributes } from '#models/attributes/shelf'

const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)

export default {
  omitPrivateAttributes,
  filterPrivateAttributes,
}
