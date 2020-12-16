// keep in sync the users database and the geo index
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const follow = __.require('lib', 'follow')
const db = __.require('level', 'geo')('geo')
const level_ = __.require('level', 'utils')
const { emptyValue } = level_

module.exports = () => {
  return follow({
    dbBaseName: 'users',
    filter: isUser,
    onChange: updatePosition,
    reset
  })
}

const isUser = doc => doc.type === 'user'

const updatePosition = change => {
  const { id, deleted, doc } = change
  const { position } = doc

  if (deleted || position == null) {
    return db.del(id)
    .catch(error_.catchNotFound)
  } else {
    const [ lat, lon ] = position
    // If the id can be found with the same coordinates, do nothing
    // else update
    return db.get({ lat, lon }, id)
    .catch(err => {
      if (err.name === 'NotFoundError') {
        return update(id, lat, lon)
      } else {
        throw err
      }
    })
    .catch(_.Error('user geo updatePosition err'))
  }
}

const update = (id, lat, lon) => db.put({ lat, lon }, id, emptyValue)

const reset = () => {
  _.log('reseting users geo index', null, 'yellow')
  return level_.reset(db.sub)
  .catch(_.ErrorRethrow('users geo index reset err'))
}
