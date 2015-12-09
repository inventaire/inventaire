# returns true if the ip is denied access to data
# false otherwise

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ ip:prerenderIp, quota } = CONFIG.prerender
{ oneDay } =  __.require 'lib', 'times'

# avoid to deny access to every undefined ips
# just because prerenderIp wasn't defined
unless prerenderIp?
  _.warn CONFIG.prerender, 'prerender access restriction disabled'
  module.exports = -> false
  return

_.info CONFIG.prerender, 'prerender access restriction enabled'

counter = 0
resetCounter = -> counter = 0
# reset the counter every 24 hours
# to loosely match Google Books reset
setInterval resetCounter, oneDay


module.exports = (ip)->
  unless ip is prerenderIp then return false

  counter += 1
  # deny access if the quota is exceeded
  if counter > quota
    _.warn 'prerender exceeded its quota'
    return true
  else
    _.info 'prerender requests count for today: ' + counter.toString()
    return false
