const _ = require('builders/utils')
const ActionByInput = require('./action_by_input')

const [ email ] = process.argv.slice(2)

_.log(email, 'email')

const validations = require('models/validations/common')

if (!validations.email(email)) { throw new Error('invalid email') }

module.exports = ActionByInput(email)
