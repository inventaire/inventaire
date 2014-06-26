module.exports.index = (req, res, next) ->
  # console.dir req.route
  # console.dir req.route.stack[0].handle.toString()
  res.send 'hello'


module.exports.hello = (req, res, next) ->
  res.send 'Hello ' + req.session.email