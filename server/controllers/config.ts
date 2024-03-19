import { sendStaticJson } from '#lib/responses'
import { assert_ } from '#lib/utils/assert_types'
import config from '#server/config'

const { piwik, spam, mapTilesAccessToken } = config

assert_.array(spam.suspectKeywords)

const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', ''),
  spam,
  mapTilesAccessToken,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
