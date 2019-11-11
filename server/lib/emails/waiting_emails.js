// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// a sub-level database to keep tracks of waiting emails
const __ = require('config').universalPath
const levelBase = __.require('level', 'base')
module.exports = levelBase.simpleSubDb('waiting')
