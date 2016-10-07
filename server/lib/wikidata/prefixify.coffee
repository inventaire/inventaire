module.exports = (value)->
  unless typeof value is 'string' then return value
  switch value[0]
    when 'Q' then "wd:#{value}"
    when 'P' then "wdt:#{value}"
    else value
