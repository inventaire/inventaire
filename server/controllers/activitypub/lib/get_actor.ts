import CONFIG from 'config'
import { unprefixify } from '#controllers/entities/lib/prefix'
import buildAttachements from './build_attachements.js'
import { buildLink, getActorTypeFromName, defaultLabel, entityUrl } from './helpers.js'
import { getSharedKeyPair } from './shared_key_pair.js'
import { validateShelf, validateUser, validateEntity } from './validations.js'

const origin = CONFIG.getPublicOrigin()
const publicHost = origin.split('://')[1]

const getShelfActor = async name => {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  const links = [
    {
      name: 'shelf',
      url: `${origin}/shelves/${shelf._id}`,
    },
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
    { name: 'inventory', url: `${origin}/users/${username}` },
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
    { name: publicHost, url: entityUrl(entity.uri) },
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
    attachment,
  })
}

const buildActorObject = async ({ actorName, displayName, summary, imagePath, links, attachment = [] }) => {
  const { publicKey, publicKeyHash } = await getSharedKeyPair()
  const actorUrl = `${origin}/api/activitypub?action=actor&name=${actorName}`
  // Use the key hash to bust any cached version of an old key
  const keyUrl = `${actorUrl}#${publicKeyHash}`

  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],
    type: 'Person',
    id: actorUrl,
    name: displayName,
    preferredUsername: actorName,
    summary,
    inbox: `${origin}/api/activitypub?action=inbox&name=${actorName}`,
    outbox: `${origin}/api/activitypub?action=outbox&name=${actorName}`,
    publicKey: {
      id: keyUrl,
      owner: `${origin}/api/activitypub?action=actor&name=${actorName}`,
    },
  }

  if (imagePath) {
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url: imagePath.startsWith('http') ? imagePath : `${origin}${imagePath}`,
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
        value: buildLink(url, value),
      }
    })
    actor.attachment = linksAttachements.concat(attachment)
  } else {
    actor.attachment = attachment
  }

  // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
  // shared public keys they already know
  actor.publicKey = {
    id: keyUrl,
    owner: actorUrl, // must be actor.id
    publicKeyPem: publicKey,
  }

  return actor
}

const getActorByType = {
  user: getUserActor,
  shelf: getShelfActor,
  entity: getEntityActor,
}

export default name => {
  const type = getActorTypeFromName(name)
  return getActorByType[type](name)
}
