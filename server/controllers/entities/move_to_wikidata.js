import moveToWikidata from './lib/move_to_wikidata.js'

const sanitization = {
  uri: {},
}

const controller = async (params, req) => {
  return moveToWikidata(req.user, params.uri)
}

export default {
  sanitization,
  controller,
  track: [ 'entity', 'moveToWikidata' ],
}
