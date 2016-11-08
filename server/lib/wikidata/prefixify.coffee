# Minial function to add prefixes to Wikidata entity and property ids
# Can only be used on Wikidata ids as passing other kind of values may produce
# undesired effects.
# Ex: Q3366047:P1476:'Pars vite et reviens tard' => 'wdt:Pars vite et reviens tard'
# In those cases, use wikidata-sdk simpifyClaims functions with prefix options
module.exports = (value)->
  unless value? then return
  switch value[0]
    when 'Q' then "wd:#{value}"
    when 'P' then "wdt:#{value}"
    else throw new Error 'prefixify was passed a non-Wikidata id value'
