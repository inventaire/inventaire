// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { pass } = require('./common')
const { types } = require('../attributes/notification')
const assert_ = require('lib/utils/assert_types')
const Group = require('../group')

const validations = module.exports = {
  pass,
  type: type => types.includes(type),
  data: (data, { type }) => {
    assert_.object(data)
    dataValidationPerType[type](data)
    return true
  }
}

const dataValidationPerType = {
  friendAcceptedRequest: ({ user }) => {
    validations.pass('userId', user)
  },
  groupUpdate: ({ group, user, attribute, previousValue, newValue }) => {
    validations.pass('groupId', group)
    validations.pass('userId', user)
    validations.pass('attribute', attribute)
    Group.validations.pass(attribute, previousValue)
    Group.validations.pass(attribute, newValue)
  },
  userMadeAdmin: ({ group, user }) => {
    validations.pass('groupId', group)
    validations.pass('userId', user)
  },
}
