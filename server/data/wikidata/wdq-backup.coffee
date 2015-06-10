__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'


module.exports =
  P50: (key)->
    url = "http://localhost:3456/wdq/_design/claims/_view/P50?keys=%5B#{key}%5D"
    promises_.get url
    .then (res)->
      ids = res.rows.map (row)-> row.id[1..-1]
      return _.log 'ids', {items: ids}
    .catch (err)->
      _.error err, 'P50 err'