import Item from '#models/item'
import privateAttributesUtilsFactory from '#lib/private_attributes_utils_factory'

const { private: privateAttributes } = Item.attributes
const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)

export default {
  omitPrivateAttributes,
  filterPrivateAttributes,
}
