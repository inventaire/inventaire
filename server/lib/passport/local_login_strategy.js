import { Strategy as LocalStrategy } from 'passport-local'
import verify from './verify_username_password.js'

export default new LocalStrategy(verify)
