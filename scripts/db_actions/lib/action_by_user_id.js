import _ from '#builders/utils'
import ActionByInput from './action_by_input.js'

const [ userId ] = process.argv.slice(2)

_.log(userId, 'userId')

if (!_.isUserId(userId)) throw new Error('invalid user id')

export default ActionByInput(userId)
