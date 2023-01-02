import _ from '#builders/utils'
import validations from '#models/validations/common'
import ActionByInput from './action_by_input.js'

const [ email ] = process.argv.slice(2)

_.log(email, 'email')

if (!validations.email(email)) { throw new Error('invalid email') }

export default ActionByInput(email)
