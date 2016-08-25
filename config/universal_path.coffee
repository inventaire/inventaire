# This is where all the path magic happens!
# By always passing by this module that nows the appRoot
# we can copy dependency imports from one file to the other
# without even having a look to which directory we are in.

# Example:

#> CONFIG = require 'config'
#> __ = CONFIG.universalPath
#> Item = __.require 'models', 'item'

# Pasting those 3 lines anywhere in the code base will have the same result:
#> require "#{appRoot}/server/models/item"

# Goodbye '../../../models/item' hard to maintain horrors, hello Freedom, Easyness and Beauty!

# The only downside I see is that it might be less clear for new comers
# to this code base to find the dependencies involved in a given module:
# if you did arrive here because you had this kind of difficulties
# and that those explanation aren't clear enough, please open an issue
# to help make it clearer

appRoot = __dirname.replace '/config', ''

module.exports =
  paths:
    root: ''
    server: '/server'
    lib: '/server/lib'
    models: '/server/models'
    utils: '/server/lib/utils'
    sharedLibs: '/client/app/lib/shared'
    data: '/server/data'
    db: '/server/db'
    couch: '/server/db/couch'
    level: '/server/db/level'
    graph: '/server/db/level/graph'
    builders: '/server/builders'
    controllers: '/server/controllers'
    leveldb: '/db/leveldb'
    couchdb: '/db/couchdb'
    i18nSrc: '/server/lib/emails/i18n/src'
    i18nArchive: '/server/lib/emails/i18n/src/archive'
    i18nTransifex: '/server/lib/emails/i18n/src/transifex'
    i18nDist: '/server/lib/emails/i18n/dist'
    i18nClientSrc: '/client/public/i18n/src'
    i18nClientDist: '/client/public/i18n/dist'
    client: '/client'
    scripts: '/scripts'
    logs: '/logs'
    uploads: '/client/public/uploads'
  path: (route, name)->
    path = @paths[route]
    rootedPath = "#{appRoot}#{path}"
    if name? then "#{rootedPath}/#{name}"
    else rootedPath
  require: (route, name)-> require @path(route, name)
