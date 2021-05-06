// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const verify = require('./verify_username_password')
const { Strategy: LocalStrategy } = require('passport-local')
module.exports = new LocalStrategy(verify)
