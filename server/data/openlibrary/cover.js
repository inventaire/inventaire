// a service to know if a cover is available
// could actually be turned into a generalist 'image-check' service
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const checkCoverExistance = require('./check_cover_existance')

const { coverByOlId } = require('./api')

const keyByType = {
  human: 'a',
  work: 'b',
  edition: 'b'
}

module.exports = async (openLibraryId, entityType) => {
  if (!openLibraryId) return null

  const type = keyByType[entityType]
  if (!type) return null

  const url = coverByOlId(openLibraryId, type)

  return checkCoverExistance(url)
  .then(_.Log('open library url found'))
  .then(url => ({
    url,
    credits: { text: 'OpenLibrary', url }
  }))
  .catch(_.ErrorRethrow('get openlibrary cover err'))
}
