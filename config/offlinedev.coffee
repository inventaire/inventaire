# HOWTO pass the login on the client
# when Mozilla Persona is unreachable
# server > export NODE_ENV=offlinedev; npm start
# client > $.post(app.API.auth.login)
# client > reload

module.exports =
  env: 'offlinedev'
  mookEmail: 'yourfakeuser@email.address'