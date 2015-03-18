module.exports = (res, err, status = 500, sendError)->
  if /^4/.test status then @warn err, "#{status} (errorHandler)"
  else @error new Error(err), err
  res.setHeader 'Content-Type', 'text/html'
  res.status status or 500
  # dont send the error details to the user on production
  # sendError is forced to true on CONFIG.sendServerErrorsClientSide
  if sendError then res.send(err)
  else res.end()