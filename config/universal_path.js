/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This is where all the path magic happens!
// By always passing by this module that nows the appRoot
// we can copy dependency imports from one file to the other
// without even having a look to which directory we are in.

// Example:

//> CONFIG = require 'config'
//> __ = CONFIG.universalPath
//> Item = __.require 'models', 'item'

// Pasting those 3 lines anywhere in the code base will have the same result:
//> require "#{appRoot}/server/models/item"

// Goodbye '../../../models/item' hard to maintain horrors, hello Freedom, Easyness and Beauty!

// The only downside I see is that it might be less clear for new comers
// to this code base to find the dependencies involved in a given module:
// if you did arrive here because you had this kind of difficulties
// and that those explanation aren't clear enough, please open an issue
// to help make it clearer

const appRoot = __dirname.replace('/config', '');

module.exports = {
  paths: {
    root: '',
    server: '/server',
    lib: '/server/lib',
    models: '/server/models',
    utils: '/server/lib/utils',
    data: '/server/data',
    db: '/server/db',
    couch: '/server/db/couch',
    level: '/server/db/level',
    builders: '/server/builders',
    controllers: '/server/controllers',
    leveldb: '/db/leveldb',
    couchdb: '/db/couchdb',
    apiTests: '/tests/api',
    i18nSrc: '/inventaire-i18n/original',
    i18nDist: '/inventaire-i18n/dist/emails',
    i18nAssets: '/inventaire-i18n/assets',
    client: '/client',
    scripts: '/scripts',
    logs: '/logs',
    uploads: '/client/public/uploads',
    modulesBin: '/node_modules/.bin',
    dumps: '/dumps/inv'
  },
  path(route, name){
    const path = this.paths[route];
    const rootedPath = `${appRoot}${path}`;
    if (name != null) { return `${rootedPath}/${name}`;
    } else { return rootedPath; }
  },
  require(route, name){ return require(this.path(route, name)); }
};
