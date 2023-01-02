import { BasicStrategy } from 'passport-http'
import verify from './verify_username_password.js'

export default new BasicStrategy(verify)
