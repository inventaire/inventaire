// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const breq = require('bluereq')
const fs_ = __.require('lib', 'fs')
const request = require('request')
const { Promise } = __.require('lib', 'promises')
const getToken = require('./get_swift_token')
const { publicURL } = CONFIG.mediaStorage.swift

const absoluteUrl = (container, filename) => `${publicURL}/${container}/${filename}`
const relativeUrl = (container, filename) => `/img/${container}/${filename}`

const getParams = (container, filename, body, type = 'application/octet-stream') => getToken()
.then(token => ({
  url: absoluteUrl(container, filename),

  headers: {
    'Accept': 'application/json',
    'Content-Type': type,
    'X-Auth-Token': token
  },

  body
}))

const action = verb => (container, filename, body, type) => getParams(container, filename, body, type)
.then(_.Log('params'))
.then(breq[verb])
.then(res => res.body || { ok: true })
.then(_.Log(`${verb} ${filename} body`))
.catch(_.ErrorRethrow(`${verb} ${filename}`))

module.exports = {
  get: action('get'),
  post: action('post'),
  put: action('put'),
  delete: action('delete'),

  // inspired by https://github.com/Automattic/knox/blob/master/lib/client.js
  putImage(container, path, filename){
    return Promise.all([
      getParams(container, filename),
      fs_.getContentLength(path)
    ])
    .spread((params, contentLength) => {
      const { headers, url } = params
      headers['Content-Length'] = contentLength
      headers['Content-Type'] = 'application/octet-stream'
      return new Promise((resolve, reject) => fs_.createReadStream(path)
      .pipe(request({ method: 'PUT', url, headers }))
      .on('error', reject)
      .on('end', resolve.bind(null, relativeUrl(container, filename))))
    })
  }
}
