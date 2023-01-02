import getEntityByUri from './lib/get_entity_by_uri.js'
import inv from './lib/create_inv_entity.js'
import wd from './lib/create_wd_entity.js'

const sanitization = {
  labels: {
    generic: 'object',
    default: {}
  },
  claims: {
    generic: 'object'
  },
  prefix: {
    allowlist: [ 'inv', 'wd' ],
    default: 'inv'
  }
}

const controller = async (params, req) => {
  const { prefix, labels, claims, reqUserId } = params
  const createFn = creators[prefix]
  params = { labels, claims }
  if (prefix === 'wd') {
    params.user = req.user
  } else {
    params.userId = reqUserId
  }
  const entity = await createFn(params)
  // Re-request the entity's data to get it formatted
  return getEntityByUri({ uri: entity.uri, refresh: true })
}

const creators = {
  inv,
  wd
}

export default {
  sanitization,
  controller,
  track: [ 'entity', 'creation' ]
}
