module.exports = (userId, otherId, status)->
  switch status
    when 'friends' then 'friends'
    when 'a-requested'
      if userId < otherId then 'userRequested'
      else 'otherRequested'
    when 'b-requested'
      if userId < otherId then 'otherRequested'
      else 'userRequested'
    else 'none'
