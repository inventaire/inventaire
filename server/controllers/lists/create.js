const lists_ = require('controllers/lists/lib/lists')

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {}
}

const controller = async params => {
  const list = await formatNewList(params)
  return { list }
}

const formatNewList = params => {
  const { name, description, visibility, reqUserId: user } = params
  const listData = {
    name,
    description,
    visibility,
    user,
  }
  return lists_.create(listData)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'creation' ]
}
