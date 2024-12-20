import { createReadStream } from 'node:fs'
import { getContentLength, rm } from '#lib/fs'
import { requests_ } from '#lib/requests'
import { log } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl, RelativeUrl } from '#types/common'
import getToken from './get_swift_token.js'

const relativeUrl = (container, filename) => `/img/${container}/${filename}` as RelativeUrl

async function getParams (container, filename) {
  const { publicURL } = config.mediaStorage?.swift
  const absoluteUrl = (container, filename) => `${publicURL}/${container}/${filename}` as AbsoluteUrl
  const token = await getToken()
  return {
    url: absoluteUrl(container, filename),
    headers: {
      accept: 'application/json',
      'content-type': 'application/octet-stream',
      'x-auth-token': token,
    },
  }
}

export default {
  // inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage: async (container, path, filename) => {
    const [ params, contentLength ] = await Promise.all([
      getParams(container, filename),
      getContentLength(path),
    ])
    const { url, headers } = params
    headers['content-length'] = contentLength
    headers['content-type'] = 'application/octet-stream'
    const stream = createReadStream(path)
    await requests_.put(url, { headers, bodyStream: stream, parseJson: false })
    log({ container, path, filename }, 'swift: put image')
    // Cleanup tmp file
    await rm(path)
    return relativeUrl(container, filename)
  },

  deleteImage: async (container, filename) => {
    const { url, headers } = await getParams(container, filename)
    await requests_.delete(url, { headers, parseJson: false })
    log({ container, filename }, 'swift: deleted image')
  },
}
