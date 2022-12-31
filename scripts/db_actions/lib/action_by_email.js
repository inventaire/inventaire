import _ from 'builders/utils'
import ActionByInput from './action_by_input'

import validations from 'models/validations/common'

const [ email ] = process.argv.slice(2)

_.log(email, 'email')

if (!validations.email(email)) { throw new Error('invalid email') }

export default ActionByInput(email)
