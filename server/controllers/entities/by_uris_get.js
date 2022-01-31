const getEntitiesByUris = require('./lib/get_entities_by_uris')
const addRelatives = require('./lib/add_relatives')
const pickProps = require('./lib/pick_props')

const sanitization = {
  uris: {},
  // Mimicking Wikibase wbgetentities props parameter
  props: {
    allowlist: [
      'labels',
      'descriptions',
      'claims',
      'sitelinks',
    ],
    optional: true
  },
  refresh: { optional: true },
  autocreate: {
    generic: 'boolean',
    optional: true,
    default: false
  },
  relatives: {
    allowlist: [
      'wdt:P50',
      'wdt:P179',
      'wdt:P629',
    ],
    optional: true
  }
}

const controller = async ({ uris, props, refresh, relatives, autocreate }) => {
  let results = await getEntitiesByUris({ uris, refresh, autocreate })
  if (relatives) results = addRelatives(results, relatives, refresh)
  if (props) results.entities = pickProps(results.entities, props)
  return results
}

module.exports = { sanitization, controller }
