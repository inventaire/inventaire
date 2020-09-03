const wdk = require('wikidata-sdk')

const helpers = module.exports = {
  removeTrailingComma: line => line.replace(/,$/, ''),

  isJsonLine: line => (line[0] === '{') && (line.slice(-1)[0] === '}'),

  logCount: counter => {
    // only log once every 100 calls to avoid slowing the process
    // by just logging things
    if ((counter % 100) === 0) return console.log(counter)
  },

  getEntityId: entity => {
    // Working around differences in entities formatting between
    // - Wikidata entities from a dump or from Wikidata API (entity.id)
    // - Wikidata entities with inventaire formatting (entity.uri)
    //   (returned in case of Inventaire entity redirection)
    // - Inventaire entities (entity.uri)
    if (entity.uri) return entity.uri.split(':')[1]
    else return entity.id || entity._id
  },

  getEntityUri: entity => {
    // Wikidata and Inventaire entities coming from the Inventaire API
    // have a URI already defined
    if (entity.uri) return entity.uri
    // Wikidata entities coming from a Wikidata dump or the Wikidata API
    // have only an id defined
    const id = helpers.getEntityId(entity)
    if (!id) throw new Error(`couldn't find entity URI: ${JSON.stringify(entity)}`)

    if (wdk.isItemId(id)) return 'wd:' + id
    else return 'inv:' + id
  },

  getEntityDomain: entity => helpers.getEntityUri(entity).split(':')[0]
}
