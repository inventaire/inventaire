import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getShelfById } from '#controllers/shelves/lib/shelves'
import { findUserByUsername, getUserById } from '#controllers/user/lib/user'
import { isCouchUuid } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { getEntityUriFromActorName, getEntityActorName } from './helpers.js'

export async function validateShelf (name) {
  const id = name.split('-')[1]
  if (!isCouchUuid(id)) throw error_.new('invalid shelf id', 400, { id })
  const shelf = await getShelfById(id)
  if (!shelf || !shelf.visibility.includes('public')) throw error_.notFound({ name })
  const owner = await getUserById(shelf.owner)
  if (!owner) throw error_.notFound({ name })
  if (!owner.fediversable) throw error_.new("shelf's owner is not on the fediverse", 404, { name })
  return { shelf, owner }
}

export async function validateUser (username) {
  const user = await findUserByUsername(username)
  if (!user) throw error_.notFound({ username })
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username })
  return { user }
}

export async function validateEntity (name) {
  const uri = getEntityUriFromActorName(name)
  const entity = await getEntityByUri({ uri })
  if (!entity) throw error_.notFound({ uri })
  // Use canonical uri
  entity.actorName = getEntityActorName(entity.uri)
  return { entity }
}
