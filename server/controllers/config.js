import CONFIG from 'config'
import { sendStaticJson } from '#lib/responses'
import { assert_ } from '#lib/utils/assert_types'

const { piwik, spam } = CONFIG

assert_.array(spam.suspectKeywords)

const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', ''),
  spam,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
