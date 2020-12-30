const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { pass, passFromFunction } = require('./common')
const { types } = require('../attributes/notification')
const Group = require('../group')

const validations = module.exports = {
  pass,
  type: type => types.includes(type),
  data: (data, { type }) => {
    passFromFunction('data', data, _.isPlainObject)
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
    passFromFunction('attribute', attribute, _.isString)
    Group.validations.pass(attribute, previousValue)
    Group.validations.pass(attribute, newValue)
  },
  userMadeAdmin: ({ group, user }) => {
    validations.pass('groupId', group)
    validations.pass('userId', user)
  },
}
