const { updateAttributes } = require('controllers/lists/lib/lists')

const sanitization = {
  id: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
}

const controller = async params => {
  const list = await updateAttributes(params)
  return { list }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'update' ]
}
