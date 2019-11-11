/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const responses_ = __.require('lib', 'responses');
const error_ = __.require('lib', 'error/error');
const { getImageByUrl } = __.require('data', 'dataseed/dataseed');
const { enabled: dataseedEnabled } = CONFIG.dataseed;

module.exports = function(req, res, next){
  const { url } = req.body;

  // If dataseed is disabled, we simply return the same url,
  // instead of converting it to an image hash
  if (!dataseedEnabled) { return res.json({ url, converted: false }); }

  return getImageByUrl(url)
  .then(function(data){
    data.converted = true;
    return responses_.send(res, data);}).catch(error_.Handler(req, res));
};
