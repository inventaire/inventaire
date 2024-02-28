import privateAttributesUtilsFactory from '#lib/private_attributes_utils_factory'
import itemAttributes from '#models/attributes/item'

const { private: privateAttributes } = itemAttributes
export const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)
