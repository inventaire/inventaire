import { getActorTypeFromName, getEntityUriFromActorName } from './helpers.js'

const getActorHtmlUrlByType = {
  user: name => `/inventory/${name}`,
  shelf: name => {
    const shelfId = name.split('-')[1]
    return `/shelves/${shelfId}`
  },
  entity: name => {
    const uri = getEntityUriFromActorName(name)
    return `/entity/${uri}`
  },
}

export default name => {
  const type = getActorTypeFromName(name)
  return getActorHtmlUrlByType[type](name)
}
