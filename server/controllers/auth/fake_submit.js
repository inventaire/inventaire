// Allows authentification forms to submit a form already
// validated by XHR calls, in order to be catched by browsers
// password manager or other field suggestions tools
// Using a different endpoint (/api/submit) than /api/auth so that
// server/middlewares/content.js fakeSubmitException can be applied
// to the strict minimum
module.exports = {
  post: (req, res) => {
    const { redirect } = req.query
    const { referer } = req.headers
    const route = solveRoute(redirect, referer)
    return res.redirect(route)
  }
}

// Possible redirection parameters by priority
// - a redirect parameter in the query string
// - the referer found in headers
// - the root
const solveRoute = (redirect, referer) => {
  if (redirect) return `/${redirect}`
  else return referer || '/'
}
