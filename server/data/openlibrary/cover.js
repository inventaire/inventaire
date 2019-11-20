// a service to know if a cover is available
// could actually be turned into a generalist 'image-check' service
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const checkCoverExistance = require('./check_cover_existance')

const { coverByOlId } = require('./api')

module.exports = (openLibraryId, entityType) => {
  let type
  if (!openLibraryId) return Promise.resolve(null)

  switch (entityType) {
  case 'human': type = 'a'; break
  case 'work': case 'edition': type = 'b'; break
  default: return Promise.resolve(null)
  }

  const url = coverByOlId(openLibraryId, type)

  return checkCoverExistance(url)
  .then(_.Log('open library url found'))
  .then(url => ({
    url,

    credits: {
      text: 'OpenLibrary',
      url
    }
  }))
  .catch(_.ErrorRethrow('get openlibrary cover err'))
}
