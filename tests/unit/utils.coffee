{ warn } = require 'inv-loggers'

module.exports =
  # A function to quickly fail when a test gets an undesired positive answer
  undesiredRes: (done)-> (res)->
    done new Error('.then function was expected not to be called')
    warn res, 'undesired positive res'

  undesiredErr: (done)-> (err)->
    done err
    warn err.body or err, 'undesired err body'
