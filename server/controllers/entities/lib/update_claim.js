module.exports = (user, uri, property, oldVal, newVal) => {
  const [ prefix, id ] = uri.split(':')
  const updater = updaters[prefix]
  return updater(user, id, property, oldVal, newVal)
}

const updaters = {
  // TODO: accept ISBN URIs
  inv: require('./update_inv_claim'),
  wd: require('./update_wd_claim')
}
