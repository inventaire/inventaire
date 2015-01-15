__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'

module.exports = getImages = (req, res)->
  dataArray = req.query.data.split '|'
  unless dataArray? then return res.json 400, 'bad query'

  promises = dataArray.map books_.getImage

  promises_.settle(promises)
  .then res.json.bind(res)
  .catch (err)-> _.errorHandler res, err
