import wbEdit from 'wikibase-edit'
import { userAgent } from '#lib/requests'
import { httpsAgent } from '#lib/requests_agent'
import config from '#server/config'

// Most edits are isolated edits from humans using the GUI, maxlag can thus be null
// in environments where the server receives requests from humans waiting for the response
// Edit requests made by special users ("bots" in mediawiki terms) must the set a maxlag in the request config
// See https://github.com/maxlath/wikibase-edit/blob/main/docs/how_to.md#maxlag
// and https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
const { maxlag } = config.wikidataEdit

// Return an instance of wikibase-edit with the general config pre-set
export default wbEdit({
  instance: 'https://www.wikidata.org',
  userAgent,
  httpRequestAgent: httpsAgent,
  // Default maxlag, to overwrite in request config when needed
  maxlag,
})
