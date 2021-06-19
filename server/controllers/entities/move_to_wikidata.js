const moveToWikidata = require('./lib/move_to_wikidata')

const sanitization = {
  uri: {}
}

const controller = async (params, req) => {
  return moveToWikidata(req.user, params.uri)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'entity', 'moveToWikidata' ]
}
