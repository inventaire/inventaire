import verify from './verify_username_password'
import { Strategy as LocalStrategy } from 'passport-local'
export default new LocalStrategy(verify)
