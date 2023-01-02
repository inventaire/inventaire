// retrieves pictures stocked on the server itself under the 'local' mediaStorage mode
// to be used in development only

import CONFIG from 'config'
import _ from '#builders/utils'
import error_ from '#lib/error/error'
import * as regex_ from '#lib/regex'

const { local: localStorage } = CONFIG.mediaStorage
const storageFolder = localStorage.folder()

// images urls look like /img/#{container}/#{hash}"
// expect the pictures' files to be in #{storageFolder}

export default {
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
