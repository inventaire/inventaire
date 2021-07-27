const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
const { getRandomBytes } = require('lib/crypto')
const { byUsername } = require('controllers/activitypub/lib/activities')

const randomActivityId = (origin = host) => `${origin}/${getRandomBytes(20, 'hex')}`

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

const getActivitiesByUsername = username => byUsername(username)

module.exports = { randomActivityId, randomActivity, getActivitiesByUsername }
