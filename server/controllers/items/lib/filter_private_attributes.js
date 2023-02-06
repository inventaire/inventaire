import privateAttributesUtilsFactory from '#lib/private_attributes_utils_factory'
import Item from '#models/item'

const { private: privateAttributes } = Item.attributes
export const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)
