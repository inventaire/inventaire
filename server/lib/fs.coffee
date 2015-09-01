Promise = require 'bluebird'
fs = require 'fs'

methods = [
  'readFile'
  'writeFile'
  'stat'
]

aliases =
  exist: 'stat'

methods.forEach (methodName)->
  exports[methodName] = Promise.promisify fs[methodName]

for k, v of aliases
  exports[k] = exports[v]