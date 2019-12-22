// keep in sync the users database and the geo index
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const follow = __.require('lib', 'follow')
const db = __.require('level', 'geo')('geo')

module.exports = () => {
  return follow({
    dbBaseName: 'users',
    filter: isUserWithPosition,
    onChange: updatePosition,
    reset
  })
}

// TODO: check that this doesn't miss to update users that just deleted their position
// and thus need to be unindexed
const isUserWithPosition = doc => {
  if (doc.type === 'user') {
    if (doc.position != null) return true
  }
  return false
}

const updatePosition = change => {
  const { id, deleted, doc } = change
  const { position } = doc

  if (deleted) {
    return db.del(id)
  } else {
    const [ lat, lon ] = position
    // Most of the user doc change wont imply a position change
    // so it should make sense to get the doc to check the need to write
    return db.getByKey(id)
    .catch(err => {
      if (err.notFound) return null
      else throw err
    })
    .then(updateIfNeeded.bind(null, id, lat, lon))
    .catch(_.Error('user geo updatePosition err'))
  }
}

const updateIfNeeded = (id, lat, lon, res) => {
  if (res != null) {
    const { position } = res
    if ((lat === position.lat) && (lon === position.lon)) return
  }

  return db.put({ lat, lon }, id, null)
}

const reset = () => {
  _.log('reseting users geo index', null, 'yellow')
  return db.reset()
}
