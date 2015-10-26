sendUsersData = (res, usersData)->
  res.json {users: usersData}

module.exports = (res)-> sendUsersData.bind null, res
