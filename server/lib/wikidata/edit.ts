import wbEdit from 'wikibase-edit'
import { userAgent } from '#lib/requests'
import { httpsAgent } from '#lib/requests_agent'
import config from '#server/config'

// Most edits are isolated edits from humans using the GUI, maxlag can thus be null
// in environments where the server receives requests from humans waiting for the response
// See https://github.com/maxlath/wikibase-edit/blob/main/docs/how_to.md#maxlag
// and https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
const { maxlag } = config.wikidataEdit

// Return an instance of wikibase-edit with the general config pre-set
export default wbEdit({
  instance: 'https://www.wikidata.org',
  userAgent,
  maxlag,
  httpRequestAgent: httpsAgent,
})
