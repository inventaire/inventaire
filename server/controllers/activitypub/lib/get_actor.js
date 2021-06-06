const CONFIG = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const couch_ = require('lib/couch')

const host = CONFIG.fullPublicHost()

module.exports = async reqUsername => {
  const user = await user_.byUsername(reqUsername)
  .then(couch_.firstDoc)
  if (!user) throw error_.new('unknown actor', 404, reqUsername)
  if (!user.fediversable) throw error_.new('this user is not on the fediverse', 404, reqUsername)
  const { picture, username } = user
  const actorUrl = `${host}/api/activitypub?action=actor&name=${username}`
  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: actorUrl,
    preferredUsername: username
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
