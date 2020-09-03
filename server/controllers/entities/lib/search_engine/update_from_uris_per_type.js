const fetchAndPutEntitiesFromUris = require('./fetch_and_put_entities_from_uris')

module.exports = async urisPerType => {
  const promises = []
  for (const type in urisPerType) {
    const uris = urisPerType[type]
    if (!(uris instanceof Array)) {
      return Promise.reject(new Error(`invalid uris array (${type})`))
    }

    if (uris.length > 0) {
      promises.push(fetchAndPutEntitiesFromUris(type, uris).catch(passNonAllowlisted))
    }
  }

  return Promise.all(promises)
}

const passNonAllowlisted = err => {
  if (err.message !== 'non allowlisted type') throw err
}
