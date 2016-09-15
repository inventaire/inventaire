verify = require './verify_username_password'
{ Strategy:LocalStrategy } = require 'passport-local'
module.exports = new LocalStrategy verify
