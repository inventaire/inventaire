const getActor = require('controllers/activitypub/lib/get_actor')

const sanitization = {
  name: {}
}

const controller = async (params, req, res) => {
  const { name } = params
  const { accept = '' } = req.headers
  const actor = await getActor(name)
  const actorMainUrl = actor.attachment?.[0]?.url
  if (accept.startsWith('text/html') && actorMainUrl) {
    res.redirect(actorMainUrl)
  } else {
    return actor
  }
}

module.exports = {
  sanitization,
  controller,
}
