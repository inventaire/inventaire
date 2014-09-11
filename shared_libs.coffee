localPath = "./server/helpers/"
sharedPath = "./client/app/lib/shared/"

module.exports = (name)->
  shared = require "#{localPath}#{name}"
  try local = require "#{sharedPath}#{name}"
  catch e then console.log "shared lib #{name} only"

  if local?
    for k,v of shared
      unless local[k]? then local[k] = v
      else throw new Error '#{name} local and shared methods conflict'
    return local
  else shared