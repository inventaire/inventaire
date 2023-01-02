import getActor from '#controllers/activitypub/lib/get_actor'
import getActorHtmlUrl from '#controllers/activitypub/lib/get_actor_html_url'

const sanitization = {
  name: {}
}

const controller = async (params, req, res) => {
  const { name } = params
  const { accept = '' } = req.headers
  // TODO: detect cases where text/html is preceded by application/json
  const prefersHtml = accept.includes('text/html')
  if (prefersHtml) {
    const actorUrl = getActorHtmlUrl(name)
    res.redirect(actorUrl)
  } else {
    return getActor(name)
  }
}

export default {
  sanitization,
  controller,
}
