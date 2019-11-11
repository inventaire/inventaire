// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { oneMinute } =  __.require('lib', 'times')

const attemptsLimit = 10
const periodMinutes = 5

let fails = {}
const flushFails = () => fails = {}

setInterval(flushFails, periodMinutes * oneMinute)

module.exports = {
  _fails() { return fails },
  _flushFails: flushFails,
  recordFail(username, label){
    if (!fails[username]) { fails[username] = 0 }
    return ++fails[username]
  },

  tooMany(username){
    return (fails[username] != null) && (fails[username] >= attemptsLimit)
  }
}
