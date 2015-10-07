{ pass, nonEmptyString, userId, localImg } = require './common-tests'

module.exports =
  pass: pass
  userId: userId
  name: (str)-> nonEmptyString str, 60
  picture: localImg
  description: (str)-> nonEmptyString str, 5000
