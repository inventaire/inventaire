import { assert_ } from '#lib/utils/assert_types'
import groupValidations from '#models/validations/group'
import notificationAttributes from '../attributes/notification.js'
import commonValidations from './common.js'

const { types } = notificationAttributes
const { pass } = commonValidations

const notificationValidations = {
  pass,
  type: type => types.includes(type),
  data: (data, { type }) => {
    assert_.object(data)
    dataValidationPerType[type](data)
    return true
  },
}

export default notificationValidations

const dataValidationPerType = {
  friendAcceptedRequest: ({ user }) => {
    notificationValidations.pass('userId', user)
  },
  groupUpdate: ({ group, user, attribute, previousValue, newValue }) => {
    notificationValidations.pass('groupId', group)
    notificationValidations.pass('userId', user)
    notificationValidations.pass('attribute', attribute)
    groupValidations.pass(attribute, previousValue)
    groupValidations.pass(attribute, newValue)
  },
  userMadeAdmin: ({ group, user }) => {
    notificationValidations.pass('groupId', group)
    notificationValidations.pass('userId', user)
  },
}
