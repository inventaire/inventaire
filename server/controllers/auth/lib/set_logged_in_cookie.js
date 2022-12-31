import { cookieMaxAge } from 'config'

// Used to trigger logged in UI on the client-side
export default res => {
  res.cookie('loggedIn', true, { maxAge: cookieMaxAge })
}
