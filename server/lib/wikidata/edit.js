import { userAgent } from '#lib/requests'

// Return an instance of wikibase-edit with the general config pre-set
export default require('wikibase-edit')({
  instance: 'https://www.wikidata.org',
  userAgent,
  // Most edits are isolated edits from humans using the GUI, maxlag could thus be omitted
  // See https://github.com/maxlath/wikibase-edit/blob/master/docs/how_to.md#maxlag
  // and https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  maxlag: null,
})
