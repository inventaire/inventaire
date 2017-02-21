# Keys: items relative to the user requesting it
# Values: authorized listings corresponding to this relation
module.exports =
  user: [ 'private', 'network', 'public' ]
  network: [ 'network', 'public' ]
  public: [ 'public' ]
