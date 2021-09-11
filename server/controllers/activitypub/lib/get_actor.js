const CONFIG = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { generateKeyPair } = require('lib/crypto').keyPair
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

  if (!sharedKeyPair) await initSharedKey()

  // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
  // shared public keys they already know
  actor.publicKey = {
    // "#" is an identifier in order to host the key in a same document as the actor URL document
    id: `${actorUrl}#main-key`,
    owner: actorUrl, // must be actor.id
    publicKeyPem: sharedKeyPair.publicKey
  }

  addIcon(actor, picture)

  return actor
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

// Using a single key pair shared between all actors managed by this server.
// Using a key pair per user would make sense if the server was storing encrypted data
// but as we are storing data in plain text, using different key pairs doesn't seem to bring any value
// See https://github.com/w3c/activitypub/issues/225
// As for key caching, "refresh on fail" seems to be the most used strategy,
// so simply creating a new shared key pair every time the server restarts seems acceptable,
// cached keys will get refreshed at their next attempt
// See https://socialhub.activitypub.rocks/t/caching-public-keys/688
let sharedKeyPair
const initSharedKey = async () => {
  sharedKeyPair = await generateKeyPair()
}
