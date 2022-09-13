const { pass, BoundedString, userId } = require('./common')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  visibility: require('./visibility'),
  creator: userId,
  name: BoundedString(0, 128),
}
