const responses_ = require('lib/responses')
const getActor = require('controllers/activitypub/lib/get_actor')
const { sanitize } = require('lib/sanitize/sanitize')

const sanitization = {
  name: {}
}

module.exports = async (req, res) => {
  const { headers } = req
  const { accept } = headers
  const { name } = sanitize(req, res, sanitization)
  const returnHtml = accept.includes('html')
  if (returnHtml) return redirectToHtml(res, name)
  const actor = await getActor(name, returnHtml, res)
  responses_.send(res, actor)
}

const redirectToHtml = (res, name) => {
  return res.redirect(`/user/${name}`)
}
