const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { createReadStream } = require('node:fs')
const { getContentLength } = require('lib/fs')
const getToken = require('./get_swift_token')
const { publicURL } = require('config').mediaStorage.swift

const absoluteUrl = (container, filename) => `${publicURL}/${container}/${filename}`
const relativeUrl = (container, filename) => `/img/${container}/${filename}`

const getParams = async (container, filename) => {
  const token = await getToken()
  return {
    url: absoluteUrl(container, filename),
    headers: {
      accept: 'application/json',
      'content-type': 'application/octet-stream',
      'x-auth-token': token
    }
  }
}

module.exports = {
  // inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage: async (container, path, filename) => {
    const [ params, contentLength ] = await Promise.all([
      getParams(container, filename),
      getContentLength(path)
    ])
    const { url, headers } = params
    headers['content-length'] = contentLength
    headers['content-type'] = 'application/octet-stream'
    const stream = createReadStream(path)
    await requests_.put(url, { headers, bodyStream: stream, parseJson: false })
    _.log({ container, path, filename }, 'swift: put image')
    return relativeUrl(container, filename)
  },

  deleteImage: async (container, filename) => {
    const { url, headers } = await getParams(container, filename)
    await requests_.delete(url, { headers, parseJson: false })
    _.log({ container, filename }, 'swift: deleted image')
  }
}
