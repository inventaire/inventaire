__ = require('config').universalPath
_ = __.require('builders', 'utils')

module.exports = (data, multivalue=false, attribute='value')->
  if multivalue then getValue = _.property attribute

  for lang, obj of data
    if multivalue
      data[lang] = obj.map getValue
    else
      data[lang] = obj[attribute]

  return data
