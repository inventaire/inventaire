module.exports =
  env: 'tests'
  protocol: 'http'
  name: "inventaire.io"
  host: 'localhost'
  port: 3009
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  secret: "yoursecrethere"
  db:
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@host}:#{@port}"
    users: 'users-tests'
    inv: 'inventory-tests'