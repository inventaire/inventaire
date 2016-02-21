verify = require './verify_username_password'
LocalStrategy = require('passport-local').Strategy
module.exports = new LocalStrategy verify
