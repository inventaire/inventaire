const privateAttributesUtilsFactory = require('lib/private_attributes_utils_factory')
const { private: privateAttributes } = require('models/attributes/shelf')

const { omitPrivateAttributes, filterPrivateAttributes } = privateAttributesUtilsFactory(privateAttributes)

module.exports = {
  omitPrivateAttributes,
  filterPrivateAttributes,
}
