const lists_ = require('controllers/lists/lib/lists')

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: []
  },
}

const controller = async params => {
  const list = await formatNewList(params)
  return { list }
}

const formatNewList = params => {
  const { name, description, visibility, reqUserId: creator } = params
  const listData = {
    name,
    description,
    visibility,
    creator,
  }
  return lists_.create(listData)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'creation' ]
}
