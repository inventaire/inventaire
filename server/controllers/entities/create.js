const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const getEntityByUri = require('./lib/get_entity_by_uri')
const sanitize = __.require('lib', 'sanitize/sanitize')

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

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { prefix, labels, claims, reqUserId } = params
    const createFn = creators[prefix]
    params = { labels, claims }
    if (prefix === 'wd') {
      params.user = req.user
    } else {
      params.userId = reqUserId
    }
    return createFn(params)
    // Re-request the entity's data to get it formatted
    .then(entity => getEntityByUri({ uri: entity.uri, refresh: true }))
  })
  .then(responses_.Send(res))
  .then(Track(req, [ 'entity', 'creation' ]))
  .catch(error_.Handler(req, res))
}

const creators = {
  inv: require('./lib/create_inv_entity'),
  wd: require('./lib/create_wd_entity')
}
