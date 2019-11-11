// Infer entity updates from other entity updates
// Ex: see if a work label should be updated after one of its editions
// got it's title updated

const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const getEntityType = require('./get_entity_type');
const promises_ = __.require('lib', 'promises');
const keepWorkLabelAndEditionTitleInSync = require('./keep_work_label_and_edition_title_in_sync');

module.exports = function(updatedDoc, property, oldVal){
  const type = getEntityType(updatedDoc.claims['wdt:P31']);
  if (type === 'edition') {
    if (property === 'wdt:P1476') {
      return keepWorkLabelAndEditionTitleInSync(updatedDoc, oldVal);
    }
  }

};
