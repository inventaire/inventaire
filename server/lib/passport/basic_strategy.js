const verify = require('./verify_username_password');
const { BasicStrategy } = require('passport-http');
module.exports = new BasicStrategy(verify);
