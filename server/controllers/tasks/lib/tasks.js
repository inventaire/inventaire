/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let tasks_;
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const promises_ = __.require('lib', 'promises');
const error_ = __.require('lib', 'error/error');
const Task = __.require('models', 'task');

const db = __.require('couch', 'base')('tasks');

module.exports = (tasks_ = {
  createInBulk(tasksDocs){
    return promises_.try(() => tasksDocs.map(Task.create))
    .then(db.bulk)
    .then(_.Log('tasks created'));
  },

  update(options){
    const { ids, attribute, newValue } = options;
    if (ids.length === 0) { return promises_.resolve([]); }

    return tasks_.byIds(ids)
    .map(task => Task.update(task, attribute, newValue))
    .then(db.bulk)
    .then(_.Log('tasks updated'));
  },

  bulkDelete: db.bulkDelete,

  byId: db.get,

  byIds: db.fetch,

  byScore(options){
    const { limit, offset } = options;
    return db.viewCustom('byScore', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    }
    );
  },

  bySuspectUri(suspectUri){
    return db.viewByKey('bySuspectUriAndState', [ suspectUri, null ]);
  },

  bySuggestionUri(suggestionUri){
    return db.viewByKey('bySuggestionUriAndState', [ suggestionUri, null ]);
  },

  bySuspectUris(suspectUris, options = {}){
    const { index, includeArchived } = options;
    return db.viewByKeys('bySuspectUriAndState', getKeys(suspectUris, includeArchived))
    .then(function(tasks){
      if (index !== true) { return tasks; }
      const tasksBySuspectUris = _.groupBy(tasks, 'suspectUri');
      return completeWithEmptyArrays(tasksBySuspectUris, suspectUris);
    });
  },

  bySuggestionUris(suggestionUris, options = {}){
    const { index, includeArchived } = options;
    return db.viewByKeys('bySuggestionUriAndState', getKeys(suggestionUris, includeArchived))
    .then(function(tasks){
      if (index !== true) { return tasks; }
      const tasksBySuggestionUris = _.groupBy(tasks, 'suggestionUri');
      return completeWithEmptyArrays(tasksBySuggestionUris, suggestionUris);
    });
  }
});

var getKeys = function(uris, includeArchived){
  const keys = uris.map(buildKey(null));
  if (includeArchived == null) { return keys; }
  const mergedKeys = uris.map(buildKey('merged'));
  const dissmissedKeys = uris.map(buildKey('dismissed'));
  return keys.concat(mergedKeys, dissmissedKeys);
};

var buildKey = state => uri => [ uri, state ];

var completeWithEmptyArrays = function(tasksByUris, uris){
  for (let uri of uris) {
    if (tasksByUris[uri] == null) { tasksByUris[uri] = []; }
  }
  return tasksByUris;
};
