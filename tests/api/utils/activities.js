const CONFIG = require('config')
const origin = CONFIG.getPublicOrigin()
const { getRandomBytes } = require('lib/crypto')

const randomActivityId = (customOrigin = origin) => `${customOrigin}/${getRandomBytes(20, 'hex')}`

const randomActivity = ({ externalId, emitterActorUrl, activityObject, type }) => {
  if (!externalId) externalId = randomActivityId(CONFIG.publicHost)
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type: type || 'Follow',
    actor: emitterActorUrl,
    object: activityObject
  }
}

module.exports = { randomActivityId, randomActivity }
