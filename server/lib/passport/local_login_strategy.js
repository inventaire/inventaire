const verify = require('./verify_username_password')
const { Strategy: LocalStrategy } = require('passport-local')
module.exports = new LocalStrategy(verify)
