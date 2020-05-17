const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const { createReadStream } = require('fs')
const { getContentLength } = __.require('lib', 'fs')
const getToken = require('./get_swift_token')
const { publicURL } = CONFIG.mediaStorage.swift

const absoluteUrl = (container, filename) => `${publicURL}/${container}/${filename}`
const relativeUrl = (container, filename) => `/img/${container}/${filename}`

const getParams = async (container, filename, body, type = 'application/octet-stream') => {
  const url = absoluteUrl(container, filename)
  const token = await getToken()
  const headers = {
    accept: 'application/json',
    'content-type': type,
    'x-auth-token': token
  }
  return { url, headers }
}

const action = verb => async (container, filename, body, type) => {
  const { url, headers } = await getParams(container, filename, body, type)
  try {
    let resBody = await requests_[verb](url, { headers })
    resBody = resBody || { ok: true }
    _.log(resBody, `${verb} ${filename} body`)
    return resBody
  } catch (err) {
    _.error(err, `swift ${verb} ${filename}`)
    throw err
  }
}

module.exports = {
  get: action('get'),
  post: action('post'),
  put: action('put'),
  delete: action('delete'),

  // inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage: async (container, path, filename) => {
    const [ params, contentLength ] = await Promise.all([
      getParams(container, filename),
      getContentLength(path)
    ])
    const { headers, url } = params
    headers['content-length'] = contentLength
    headers['content-type'] = 'application/octet-stream'
    const stream = createReadStream(path)
    const res = await requests_.put(url, { headers, bodyStream: stream, parseJson: false })
    _.log(res, 'swift putImage')
    return relativeUrl(container, filename)
  }
}
