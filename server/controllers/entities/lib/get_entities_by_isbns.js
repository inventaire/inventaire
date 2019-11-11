/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const entities_ = require('./entities');
const promises_ = __.require('lib', 'promises');
const { parse:parseIsbn, normalizeIsbn } = __.require('lib', 'isbn/isbn');
const dataseed = __.require('data', 'dataseed/dataseed');
const scaffoldEditionEntityFromSeed = require('./scaffold_entity_from_seed/edition');
const formatEditionEntity = require('./format_edition_entity');
const isbn_ = __.require('lib', 'isbn/isbn');
const { prefixifyIsbn } = __.require('controllers', 'entities/lib/prefix');

module.exports = function(rawIsbns, params){
  const [ isbns, redirections ] = Array.from(getRedirections(rawIsbns));
  const { refresh } = params;
  // search entities by isbn locally
  return entities_.byIsbns(isbns)
  .then(function(entities){
    let results;
    const foundIsbns = entities.map(getIsbn13h);
    const missingIsbns = _.difference(isbns, foundIsbns);

    entities = entities.map(formatEditionEntity);

    if (missingIsbns.length === 0) {
      results = { entities };
      return addRedirections(results, redirections);
    }

    // then look for missing isbns on dataseed
    return getMissingEditionEntitiesFromSeeds(missingIsbns, refresh)
    .spread(function(newEntities, notFound){
      results = { entities: entities.concat(newEntities) };

      if (notFound.length > 0) {
        results.notFound = _.map(notFound, 'isbn').map(prefixifyIsbn);
      }

      return addRedirections(results, redirections);
    });
  });
};

var getIsbn13h = entity => entity.claims['wdt:P212'][0];

var getMissingEditionEntitiesFromSeeds = (isbns, refresh) => dataseed.getByIsbns(isbns, refresh)
.then(function(seeds){
  const insufficientData = [];
  const validSeeds = [];
  // TODO: Filter out more aggressively bad quality seeds
  // - titles with punctuations
  // - authors with punctuations or single word
  for (let seed of seeds) {
    if (_.isNonEmptyString(seed.title)) { validSeeds.push(seed);
    } else { insufficientData.push(seed); }
  }

  return promises_.all(validSeeds.map(scaffoldEditionEntityFromSeed))
  .map(formatEditionEntity)
  .then(newEntities => [ newEntities, insufficientData ]);});

var getRedirections = function(isbns){
  // isbns list, redirections object
  const accumulator = [ [], {} ];
  return isbns.reduce(aggregateIsbnRedirections, accumulator);
};

// Redirection mechanism is coupled with the way
// ./get_entities_by_uris 'mergeResponses' parses redirections
var aggregateIsbnRedirections = function(accumulator, rawIsbn){
  const { isbn13:uriIsbn, isbn13h:claimIsbn } = isbn_.parse(rawIsbn);
  const rawUri = `isbn:${rawIsbn}`;
  const uri = `isbn:${uriIsbn}`;
  accumulator[0].push(claimIsbn);
  if (rawUri !== uri) { accumulator[1][uri] = { from: rawUri, to: uri }; }
  return accumulator;
};

var addRedirections = function(results, redirections){
  results.entities = results.entities.map(function(entity){
    const { uri } = entity;
    const redirects = redirections[uri];
    if (redirects != null) { entity.redirects = redirects; }
    return entity;
  });

  return results;
};
