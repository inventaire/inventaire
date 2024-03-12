import CONFIG from '#server/config'

const { cookieMaxAge } = CONFIG

// Used to trigger logged in UI on the client-side
export default res => {
  res.cookie('loggedIn', true, { maxAge: cookieMaxAge })
}
