import { log } from '#lib/utils/logs'
import validations from '#models/validations/common'
import ActionByInput from './action_by_input.js'

const [ email ] = process.argv.slice(2)

log(email, 'email')

if (!validations.email(email)) { throw new Error('invalid email') }

export default ActionByInput(email)
