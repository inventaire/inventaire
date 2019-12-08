// Allows authentification forms to submit a form already
// validated by XHR calls, in order to be catched by browsers
// password manager or other field suggestions tools
// Using a different endpoint (/api/submit) than /api/auth so that
// server/middlewares/content.js fakeSubmitException can be applied
// to the strict minimum
module.exports = {
  post: (req, res) => {
    const { redirect } = req.query
    const route = redirect ? `/${redirect}` : '/'
    res.redirect(route)
  }
}
