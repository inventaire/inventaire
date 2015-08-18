__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'
wd_ = __.require 'lib', 'wikidata'
wdqFallback = require './wdq_fallback'

module.exports = (req, res)->
  { query, pid, qid } = req.query
  try _.types [query, pid, qid], 'strings...'
  catch err
    return error_.bundle res, 'bad parameters', 400, err

  key = "wdq:#{query}:#{pid}:#{qid}"
  cache_.get key, requestWdq.bind(null, query, pid, qid)
  .then res.json.bind(res)
  .catch error_.Handler(res)

requestWdq = (query, P, Q)->
  switch query
    when 'claim' then return claim(P,Q)
    else throw error_.new "#{query} requestWdq isnt implemented", 400, arguments

claim = (P, Q)->
  try
    P = wdk.normalizeId P, false, 'P'
    Q = wdk.normalizeId Q, false, 'Q'
  catch err
    throw error_.complete err, 400, arguments

  url = wdk.getReverseClaims P, Q

  promises_.get url
  .catch localFallback.bind(null, P, Q)
  .catch _.Error('localFallback err')


localFallback = (P, Q, err)->
  _.warn arguments, 'wdq err: using fallback'
  wdqFallback.claim P, Q
