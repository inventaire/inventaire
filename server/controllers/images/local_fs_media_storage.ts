// retrieves pictures stocked on the server itself under the 'local' mediaStorage mode
import parseUrl from 'parseurl'
import { localStorageFolder } from '#controllers/images/lib/local_client'
import { bundleError } from '#lib/error/pre_filled'
// to be used in development only
import * as regex_ from '#lib/regex'
import { logError } from '#lib/utils/logs'

// images urls look like /img/${container}/${hash}"
// expect the pictures' files to be in ${localStorageFolder}/${container}/

export default {
  get: (req, res) => {
    const { pathname } = parseUrl(req)

    if (!pathname) {
      return bundleError(req, res, 'invalid pathname', 400, { url: parseUrl(req) })
    }

    const [ container, filename ] = pathname.split('/').slice(2)

    if (!container) {
      return bundleError(req, res, 'invalid container', 400, { pathname, container, filename })
    }

    if (!filename) {
      return bundleError(req, res, 'invalid filename', 400, { pathname, container, filename })
    }

    const [ hash, extension, ...others ] = filename.split('.')

    if (others.length > 0) {
      return bundleError(req, res, 'invalid image path', 400, { filename })
    }

    if (!regex_.Sha1.test(hash) && container !== 'assets') {
      return bundleError(req, res, 'invalid image hash', 400, { filename, hash, extension })
    }

    const filepath = `${localStorageFolder}/${container}/${filename}`

    res.sendFile(filepath, options, err => {
      if (err != null) {
        logError(err, `failed to send ${filepath}`)
        res.status(err.statusCode).json(err)
      }
    })
  },
}

const options = {
  headers: {
    'content-type': 'image/jpeg',
  },
}
