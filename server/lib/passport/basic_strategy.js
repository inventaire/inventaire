// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const verify = require('./verify_username_password')
const { BasicStrategy } = require('passport-http')
module.exports = new BasicStrategy(verify)
