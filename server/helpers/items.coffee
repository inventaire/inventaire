module.exports =
  isValidItem: (item)->
    requiredKeys = ['title', '_id']
    valid = true

    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false

    return valid