const { pass, BoundedString, userId } = require('./common')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  visibility: require('./visibility'),
  user: userId,
  name: BoundedString(0, 128),
}
