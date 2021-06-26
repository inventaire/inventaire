const CONFIG = require('config')
const { getRandomBytes } = require('lib/crypto')
const { byExternalId } = require('controllers/activitypub/lib/activities')

const randomActivityId = origin => `${origin}/${getRandomBytes(20, 'hex')}`

const randomActivity = ({ externalId, emitterActorUrl, activityObject, type }) => {
  if (!externalId) externalId = randomActivityId(CONFIG.publicHost)
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: externalId,
    type: type || 'Follow',
    actor: emitterActorUrl,
    object: activityObject
  }
}

const getActivityByExternalId = id => byExternalId(id)

module.exports = { getActivityByExternalId, randomActivityId, randomActivity }
