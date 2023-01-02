import privateAttributesUtilsFactory from '#lib/private_attributes_utils_factory'
import shelfAttributes from '#models/attributes/shelf'

const { private: privateAttributes } = shelfAttributes

export const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)
