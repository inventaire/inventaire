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
  const credits = { text: 'OpenLibrary', url }

  try {
    await checkCoverExistance(url, 'image/jpeg')
    _.log(url, 'open library url found')
    return { url, credits }
  } catch (err) {
    if (err.statusCode === 404) return {}
    _.error(err, 'get openlibrary cover err')
    throw err
  }
}
