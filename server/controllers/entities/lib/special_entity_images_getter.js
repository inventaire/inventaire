/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const entities_ = require('./entities');
const getOriginalLang = __.require('lib', 'wikidata/get_original_lang');
const getSerieParts = require('./get_serie_parts');
const getEntityImagesFromClaims = require('./get_entity_images_from_claims');

module.exports = {
  // Works images (wdt:P18) in Wikidata aren't satisfying, as not making use
  // of the right to fair-use, thus the need to fetch editions covers instead
  work(entity, limitPerLang){
    const { uri } = entity;
    const images = { claims: getEntityImagesFromClaims(entity) };
    return getWorkEditions(uri, images, limitPerLang);
  },

  // Idem
  serie(entity){
    const { uri } = entity;
    const images = { claims: getEntityImagesFromClaims(entity) };
    return getSerieParts({ uri })
    .then(res => _.map(res.parts, 'uri'))
    .map(getOneWorkImagePerLang)
    .reduce(aggregateWorkImages, images);
  }
};

var getWorkEditions = (workUri, images, limitPerLang) => entities_.byClaim('wdt:P629', workUri, true, true)
.then(addEditionsImages(images, limitPerLang));

var addEditionsImages = (images, limitPerLang = 3) => (function(editions) {
  for (let edition of editions) {
    const lang = getOriginalLang(edition.claims);
    const image = edition.claims['invp:P2'] != null ? edition.claims['invp:P2'][0] : undefined;
    if ((lang != null) && (image != null)) { addImage(images, lang, limitPerLang, image); }
  }

  return images;
});

var getOneWorkImagePerLang = workUri => getWorkEditions(workUri, {}, 1);

var aggregateWorkImages = function(images, workImages){
  for (let key in workImages) {
    // Ignore work claims images
    const values = workImages[key];
    if (_.isLang(key)) { addImage(images, key, 3, values[0]); }
  }

  return images;
};

var addImage = function(images, lang, limitPerLang, image){
  if (!images[lang]) { images[lang] = []; }
  if (images[lang].length >= limitPerLang) { return; }
  // Prevent duplicates that could be caused by multi-works editions
  // Where several work consider having the same edition and thus
  // would here return the same image.
  // Multi-work editions images shouldn't be discarded as they often
  // are actually better non-work specific illustrations of series
  // ex: https://inventaire.io/entity/isbn:9782302019249
  if (images[lang].includes(image)) { return; }
  // Index images by language so that we can illustrate a work
  // with the cover from an edition of the user's language
  // when possible
  images[lang].push(image);
};
