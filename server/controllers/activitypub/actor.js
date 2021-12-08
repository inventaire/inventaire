const getActor = require('controllers/activitypub/lib/get_actor')
const getActorHtmlUrl = require('controllers/activitypub/lib/get_actor_html_url')

const sanitization = {
  name: {}
}

const controller = async (params, req, res) => {
  const { name } = params
  const { accept = '' } = req.headers
  // TODO: detect cases were text/html is preceded by application/json
  const prefersHtml = accept.includes('text/html')
  if (prefersHtml) {
    const actorUrl = getActorHtmlUrl(name)
    res.redirect(actorUrl)
  } else {
    return getActor(name)
  }
}

module.exports = {
  sanitization,
  controller,
}
