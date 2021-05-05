// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const verify = require('./verify_username_password')
const { BasicStrategy } = require('passport-http')
module.exports = new BasicStrategy(verify)
