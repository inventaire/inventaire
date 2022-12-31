import verify from './verify_username_password'
import { BasicStrategy } from 'passport-http'
export default new BasicStrategy(verify)
