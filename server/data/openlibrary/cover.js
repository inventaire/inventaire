// a service to know if a cover is available
// could actually be turned into a generalist 'image-check' service
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const checkCoverExistance = require('./check_cover_existance')

const { coverByOlId } = require('./api')

const keyByType = {
  human: 'a',
  work: 'b',
  edition: 'b'
}

module.exports = (openLibraryId, entityType) => {
  if (!openLibraryId) return Promise.resolve(null)

  const type = keyByType[entityType]
  if (!type) return Promise.resolve(null)

  const url = coverByOlId(openLibraryId, type)

  return checkCoverExistance(url)
  .then(_.Log('open library url found'))
  .then(url => ({
    url,
    credits: { text: 'OpenLibrary', url }
  }))
  .catch(_.ErrorRethrow('get openlibrary cover err'))
}
