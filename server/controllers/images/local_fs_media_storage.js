// retrieves pictures stocked on the server itself under the 'local' mediaStorage mode
// to be used in development only

const _ = require('builders/utils')
const error_ = require('lib/error/error')
const regex_ = require('lib/regex')
const { local: localStorage } = require('config').mediaStorage
const storageFolder = localStorage.folder()

// images urls look like /img/#{container}/#{hash}"
// expect the pictures' files to be in #{storageFolder}

module.exports = {
  get: (req, res) => {
    const { pathname } = req._parsedUrl

    if (!pathname) {
      return error_.bundle(req, res, 'invalid pathname', 400, { url: req._parsedUrl })
    }

    const [ container, filename ] = pathname.split('/').slice(2)

    if (!container) {
      return error_.bundle(req, res, 'invalid container', 400, { pathname, container, filename })
    }

    if (!filename) {
      return error_.bundle(req, res, 'invalid filename', 400, { pathname, container, filename })
    }

    const [ hash, extension, ...others ] = filename.split('.')

    if (others.length > 0) {
      return error_.bundle(req, res, 'invalid image path', 400, { filename })
    }

    if (!regex_.Sha1.test(hash) && container !== 'assets') {
      return error_.bundle(req, res, 'invalid image hash', 400, { filename, hash, extension })
    }

    const filepath = `${storageFolder}/${container}/${filename}`

    res.sendFile(filepath, options, err => {
      if (err != null) {
        _.error(err, `failed to send ${filepath}`)
        res.status(err.statusCode).json(err)
      }
    })
  }
}

const options = {
  headers: {
    'content-type': 'image/jpeg'
  }
}
