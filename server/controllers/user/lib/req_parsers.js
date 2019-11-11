// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const User = __.require('models', 'user')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')

module.exports = {
  findLanguage(req){
    const accept = req.headers['accept-language']
    const language = __guardMethod__(accept, 'split', o => o.split(',')[0])
    if (User.validations.language(language)) return language
  }
}

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName)
  } else {
    return undefined
  }
}