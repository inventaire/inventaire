// retrieves pictures stocked on the server itself under the 'local' mediaStorage mode
// to be used in development only

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const regex_ = __.require('lib', 'regex')
const { local: localStorage } = CONFIG.mediaStorage
const storageFolder = localStorage.folder()

// images urls look like /img/#{container}/#{hash}"
// expect the pictures' files to be in #{storageFolder}

exports.get = (req, res, next) => {
  const { pathname } = req._parsedUrl
  const [ container, filename ] = Array.from(pathname.split('/').slice(2))
  const [ hash, extension, ...others ] = filename.split('.')

  if (others.length > 0) {
    return error_.bundle(req, res, 'invalid image path', 400, { filename })
  }

  if (!regex_.Sha1.test(hash) && (container !== 'assets')) {
    return error_.bundle(req, res, 'invalid image hash', 400, { filename, hash, extension })
  }

  const filepath = `${storageFolder}/${container}/${filename}`

  const options = {
    headers: {
      'Content-Type': 'image/jpeg'
    }
  }

  return res.sendFile(filepath, options, err => {
    if (err != null) {
      _.error(err, `failed to send ${filepath}`)
      return res.status(err.statusCode).json(err)
    }
  })
}
