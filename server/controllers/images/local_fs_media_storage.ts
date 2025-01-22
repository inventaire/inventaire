// Retrieves pictures stored on the server itself, when mediaStorage mode=local.
// Images urls look like /img/${container}/${hash}"
// expect the pictures' files to be in ${localStorageFolder}/${container}/

import parseUrl from 'parseurl'
import { uploadContainersNames } from '#controllers/images/lib/containers'
import { localStorageFolder } from '#controllers/images/lib/local_client'
import { absolutePath } from '#lib/absolute_path'
import { bundleError } from '#lib/error/pre_filled'
import { mkdirp } from '#lib/fs'
import * as regex_ from '#lib/regex'
import { arrayIncludes } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'
import { federatedMode } from '#server/config'

const imagesAssetsFolder = absolutePath('server', 'assets/images')

async function createLocalImageStorageSubFolder (container: string) {
  const folderPath = `${localStorageFolder}/${container}`
  await mkdirp(folderPath)
}

await Promise.all(uploadContainersNames.map(createLocalImageStorageSubFolder))

export default {
  get: (req, res) => {
    const { pathname } = parseUrl(req)

    if (!pathname) {
      return bundleError(req, res, 'invalid pathname', 400, { url: parseUrl(req) })
    }

    const [ container, filename ] = pathname.split('/').slice(2)

    if (!container || !(container === 'assets' || arrayIncludes(uploadContainersNames, container))) {
      return bundleError(req, res, 'invalid container', 400, { pathname, container, filename })
    }

    if (federatedMode && container === 'entities') {
      return bundleError(req, res, 'no local entities images in federated mode', 400, { pathname, container, filename })
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

    let filepath
    if (container === 'assets') {
      filepath = `${imagesAssetsFolder}/${filename}`
    } else {
      filepath = `${localStorageFolder}/${container}/${filename}`
    }

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
