# This module helps to resolve Wikimedia project-based alias URIs
# ex: 'frwiki:Lucien_Suel' to request 'wd:Q3265721'
# It's purpose is to be a sweet for expert users but it isn't a performant
# way to request entities: canonical URIs should be prefered when possible

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'
promises_ = __.require 'lib', 'promises'
getWikidataEnrichedEntities = require './get_wikidata_enriched_entities'
addRedirection = require './add_redirection'

module.exports = (uris, refresh)->
  { titles, sites } = uris.reduce parseUris, { titles: new Set, sites: new Set }
  titles = Array.from titles
  sites = Array.from sites

  url = wdk.getWikidataIdsFromSitelinks
    titles: titles
    sites: sites
    # Requesting the minimum data possible as we just want to find the ids
    props: 'sitelinks'

  promises_.get url
  .then (res)->
    { entities } = res
    # If the title can't be resolved, entities['-1'] will contain data about
    # the missing entity
    delete entities['-1']
    ids = Object.keys entities

    if ids.length is 0 then return { entities: [] }

    getWikidataEnrichedEntities ids, refresh
    .then (results)->
      for entity in results.entities
        redirection = findRedirection sites, uris, entity.sitelinks
        if redirection? then addRedirection redirection, entity

      return results

parseUris = (data, uri)->
  [ site, title ] = uri.split ':'
  data.titles.add title
  data.sites.add site
  return data

findRedirection = (sites, requestedUris, sitelinks)->
  for site in sites
    title = sitelinks[site]
    aliasUri = "#{site}:#{title}"
    for uri in requestedUris
      if aliasUri is uri or formatUri(aliasUri) is uri then return uri

  return

# Wikidata sitelinks use spaces and not underscores as word separator
formatUri = (uri)-> uri.replace /\s/g, '_'
