const CONFIG = require('config')
const { validateShelf, validateUser, validateEntity } = require('./validations')
const { getSharedKeyPair } = require('./shared_key_pair')
const { buildLink, getActorTypeFromName, defaultLabel, entityUrl } = require('./helpers')
const { unprefixify } = require('controllers/entities/lib/prefix')
const buildAttachements = require('./build_attachements')
const { publicHost } = CONFIG
const host = CONFIG.fullPublicHost()

const getShelfActor = async name => {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  const links = [
    {
      name: 'shelf',
      url: `${host}/shelves/${shelf._id}`
    }
  ]

  return buildActorObject({
    actorName: name,
    displayName: `${shelf.name} [${owner.username}]`,
    summary: description,
    links,
  })
}

const getUserActor = async username => {
  const { user } = await validateUser(username)
  const { picture, stableUsername, bio } = user
  const links = [
    { name: 'inventory', url: `${host}/inventory/${username}` }
  ]
  return buildActorObject({
    actorName: stableUsername,
    displayName: username,
    summary: bio,
    imagePath: picture,
    links,
  })
}

const getEntityActor = async name => {
  const { entity } = await validateEntity(name)
  const label = defaultLabel(entity)
  const links = [
    { name: publicHost, url: entityUrl(entity.uri) }
  ]

  if (entity.uri.startsWith('wd:')) {
    links.push({ name: 'wikidata.org', url: `https://www.wikidata.org/wiki/${unprefixify(entity.uri)}` })
  }
  const attachment = await buildAttachements(entity)
  return buildActorObject({
    actorName: entity.actorName,
    displayName: label,
    summary: entity.descriptions?.en,
    imagePath: entity.image.url,
    links,
    attachment
  })
}

const buildActorObject = async ({ actorName, displayName, summary, imagePath, links, attachment = [] }) => {
  const actorUrl = `${host}/api/activitypub?action=actor&name=${actorName}`
  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: actorUrl,
    name: displayName,
    preferredUsername: actorName,
    summary,
    inbox: `${host}/api/activitypub?action=inbox&name=${actorName}`,
    outbox: `${host}/api/activitypub?action=outbox&name=${actorName}`,
    publicKey: {
      id: `${host}/api/activitypub?action=actor&name=${actorName}#main-key`,
      owner: `${host}/api/activitypub?action=actor&name=${actorName}`
    }
  }

  if (imagePath) {
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url: imagePath.startsWith('http') ? imagePath : `${host}${imagePath}`
    }
  }

  if (links) {
    const linksAttachements = links.map(({ name, url }) => {
      const [ protocol, urlWithoutProtocol ] = url.split('://')
      const value = `<span class="invisible">${protocol}://</span><span>${urlWithoutProtocol}</span>`
      return {
        type: 'PropertyValue',
        name,
        url,
        value: buildLink(url, value)
      }
    })
    actor.attachment = linksAttachements.concat(attachment)
  } else {
    actor.attachment = attachment
  }

  const { publicKey } = await getSharedKeyPair()

  // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
  // shared public keys they already know
  actor.publicKey = {
    // "#" is an identifier in order to host the key in a same document as the actor URL document
    id: `${actorUrl}#main-key`,
    owner: actorUrl, // must be actor.id
    publicKeyPem: publicKey
  }

  return actor
}

const getActorByType = {
  user: getUserActor,
  shelf: getShelfActor,
  entity: getEntityActor,
}

module.exports = name => {
  const type = getActorTypeFromName(name)
  return getActorByType[type](name)
}
