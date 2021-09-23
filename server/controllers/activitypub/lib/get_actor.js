const CONFIG = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')

const host = CONFIG.fullPublicHost()

module.exports = async requestedUsername => {
  const user = await user_.findOneByUsername(requestedUsername)
  if (!user || !user.fediversable) throw error_.notFound({ requestedUsername })
  const { picture, stableUsername } = user
  const actorUrl = `${host}/api/activitypub?action=actor&name=${stableUsername}`
  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: actorUrl,
    preferredUsername: stableUsername,
    inbox: `${host}/api/activitypub?action=inbox&name=${stableUsername}`,
    outbox: `${host}/api/activitypub?action=outbox&name=${stableUsername}`
  }
  await addKeyPair(actor, user, actorUrl)
  addIcon(actor, picture)
  return actor
}

const addKeyPair = async (actor, user, actorUrl) => {
  let { publicKey: publicKeyPem } = user
  if (!publicKeyPem) {
    const keyPair = await user_.createKeyPair(user)
    publicKeyPem = keyPair.publicKey
  }
  actor.publicKey = {
    // "#" is an identifier in order to host the key in a same document as the actor URL document
    id: `${actorUrl}#main-key`,
    owner: actorUrl, // must be actor.id
    publicKeyPem
  }
}

const addIcon = (actor, picture) => {
  if (!picture) return
  const userPictureUrl = `${host}${picture}`
  actor.icon = {
    mediaType: 'image/jpeg',
    type: 'Image',
    url: userPictureUrl
  }
}
