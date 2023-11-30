import wbEdit from 'wikibase-edit'
import { userAgent } from '#lib/requests'
import { httpsAgent } from '#lib/requests_agent'

// Return an instance of wikibase-edit with the general config pre-set
export default wbEdit({
  instance: 'https://www.wikidata.org',
  userAgent,
  // Most edits are isolated edits from humans using the GUI, maxlag could thus be omitted
  // See https://github.com/maxlath/wikibase-edit/blob/main/docs/how_to.md#maxlag
  // and https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  maxlag: null,
  httpRequestAgent: httpsAgent,
})
