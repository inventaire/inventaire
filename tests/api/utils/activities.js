const { getRandomBytes } = require('lib/crypto')
const { byExternalId } = require('controllers/activitypub/lib/activities')

const randomActivityId = origin => `${origin}/${getRandomBytes(20, 'hex')}`

const getActivityByExternalId = id => byExternalId(id)

module.exports = { getActivityByExternalId, randomActivityId }
