import config from '#server/config'

const { cookieMaxAge } = config

// Used to trigger logged in UI on the client-side
export default res => {
  res.cookie('loggedIn', true, { maxAge: cookieMaxAge })
}
