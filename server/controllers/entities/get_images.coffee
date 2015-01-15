__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
books_ = __.require 'lib', 'books'

module.exports = getImages = (req, res)->
  dataArray = req.query.data?.split '|'
  unless dataArray?.length > 0
    return _.errorHandler res, 'empty query', 400

  promises = dataArray.map (data)-> books_.getImage(data)

  promises_.settle(promises)
  .then res.json.bind(res)
  .catch (err)-> _.errorHandler res, err
