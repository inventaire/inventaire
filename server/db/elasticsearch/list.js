const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

// Using CouchDB database names + environment suffix as indexes names
const syncDataList = [
  { dbBaseName: 'users', type: 'user' },
  { dbBaseName: 'groups', type: 'group' }
  // No 'entities' entry as it is fully handled by the entities search engine
  // See server/controllers/entities/lib/update_search_engine.coffee
]
.map(function(data){
  data.dbName = CONFIG.db.name(data.dbBaseName);
  return data;
});

const indexesList = syncDataList.map(_.property('dbName'));

module.exports = { syncDataList, indexesList };
