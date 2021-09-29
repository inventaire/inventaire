const error_ = require('lib/error/error')
const { isCouchUuid } = require('lib/boolean_validations')
const user_ = require('controllers/user/lib/user')
const shelves_ = require('controllers/shelves/lib/shelves')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { getEntityUriFromActorName, getEntityActorName } = require('./helpers')

module.exports = {
  validateShelf: async name => {
    const id = name.split('-')[1]
    if (!isCouchUuid(id)) throw error_.new('invalid shelf id', 400, { id })
    const shelf = await shelves_.byId(id)
    if (!shelf || shelf.listing !== 'public') throw error_.notFound({ name })
    const owner = await user_.byId(shelf.owner)
    if (!owner) throw error_.notFound({ name })
    if (!owner.fediversable) throw error_.new("shelf's owner is not on the fediverse", 404, { name })
    return { shelf, owner }
  },
  validateUser: async username => {
    const user = await user_.findOneByUsername(username)
    if (!user) throw error_.notFound({ username })
    if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username })
    return { user }
  },
  validateEntity: async name => {
    const uri = getEntityUriFromActorName(name)
    const entity = await getEntityByUri({ uri })
    if (!entity) throw error_.notFound({ uri })
    // Use canonical uri
    entity.actorName = getEntityActorName(entity.uri)
    return { entity }
  }
}
