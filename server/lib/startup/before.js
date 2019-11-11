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
// Needs to be run before the first promise is fired
// so that the configuration applies to all
const { Promise } = __.require('lib', 'promises')

const { red } = require('chalk')

module.exports = function() {
  initUncaughtExceptionCatcher()

  _.logErrorsCount()
  _.log(`pid: ${process.pid}`)
  _.log(`env: ${CONFIG.env}`)
  return _.log(`host: ${CONFIG.fullHost()}`)
}

var initUncaughtExceptionCatcher = () => process.on('uncaughtException', err => console.error(red('uncaughtException'), err))
