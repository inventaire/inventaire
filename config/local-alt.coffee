# To start a dev alternative instance:
# `export NODE_APP_INSTANCE=alt; coffee server.coffee`

module.exports =
  port: 3007
  runJobsInQueue:
    'wd:popularity': true
