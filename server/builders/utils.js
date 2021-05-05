// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('lodash')
const server_ = require('lib/utils/base')
const logs_ = require('lib/utils/logs')(_)
const booleanValidations_ = require('lib/boolean_validations')

module.exports = Object.assign(_, server_, logs_, booleanValidations_)
