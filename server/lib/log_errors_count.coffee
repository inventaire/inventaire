# logs the errors total if there was an error
# in the last 5 seconds
# -> just a convenience for debugging
module.exports = (_)->
  prev = 0
  counter = ->
    errs = _.errorCount()
    if errs isnt prev
      prev = errs
      console.log 'errors: '.red + errs

  setInterval counter, 5 * 1000