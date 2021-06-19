const getEntitiesByUris = require('./lib/get_entities_by_uris')
const addRelatives = require('./lib/add_relatives')

const validRelativesProperties = [
  'wdt:P50',
  'wdt:P179',
  'wdt:P629'
]

const sanitization = {
  uris: {},
  refresh: { optional: true },
  autocreate: {
    generic: 'boolean',
    optional: true,
    default: false
  },
  relatives: {
    allowlist: validRelativesProperties,
    optional: true
  }
}

const controller = async ({ uris, refresh, relatives, autocreate }) => {
  const results = await getEntitiesByUris({ uris, refresh, autocreate })
  if (relatives) return addRelatives(results, relatives, refresh)
  else return results
}

module.exports = { sanitization, controller }
