verify = require './verify_username_password'
{ BasicStrategy } = require 'passport-http'
module.exports = new BasicStrategy verify
