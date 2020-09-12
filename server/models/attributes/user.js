const attributes = module.exports = {}

// Attributes that can be send to the owner
attributes.ownerSafe = [
  '_id',
  '_rev',
  'type',
  'username',
  'created',
  'email',
  'picture',
  'language',
  'creationStrategy',
  'hasPassword',
  'validEmail',
  'bio',
  'settings',
  'position',
  'summaryPeriodicity',
  'readToken',
  'roles',
  'snapshot'
]

attributes.public = [
  '_id',
  'username',
  'created',
  'picture',
  'bio',
  'position',
  'special',
  'created',
  'roles',
  // Non-authorized data should still be deleted
  // snapshot.private
  // snapshot.network (unless requested by someone of the user network)
  // cf server/controllers/user/lib/authorized_user_data_pickers omitPrivateData
  'snapshot'
]

// Attributes that need availability check before update
attributes.concurrencial = [
  'username',
  'email'
]

// Attributes that can be changed with a simple validity check
attributes.updatable = [
  'picture',
  'language',
  'bio',
  'settings',
  'position',
  'summaryPeriodicity'
]

// Attributes that are kept after a user deleted her account
attributes.critical = [
  '_id',
  '_rev',
  'username'
]

// Attributes to keep in documents where a stakeholder might loose
// access to those data
// ex: in a transaction, when the user was deleted
// The _id is already recorded by a transaction
// thus its absence here as long as only transactions doc uses snaphshot
attributes.snapshot = [
  'username',
  'picture'
]

attributes.acceptNullValue = [
  'position',
  'picture'
]

attributes.creationStrategies = [ 'local' ]

attributes.notificationsSettings = [
  // GLOBAL
  'global',

  // NEWS
  // 'newsletters'
  'inventories_activity_summary',

  // NETWORK
  'friend_accepted_request',
  'friendship_request',
  'group_invite',
  'group_acceptRequest',

  // TRANSACTIONS
  'your_item_was_requested',
  'update_on_your_item',
  'update_on_item_you_requested'
]
