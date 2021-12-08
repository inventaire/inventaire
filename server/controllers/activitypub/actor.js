const getActor = require('controllers/activitypub/lib/get_actor')

const sanitization = {
  name: {}
}

const controller = async (params, req, res) => {
  const { name } = params
  const { accept = '' } = req.headers
  const returnHtml = accept.includes('text/html')
  return getActor(name, returnHtml, res)
}

module.exports = {
  sanitization,
  controller,
}
