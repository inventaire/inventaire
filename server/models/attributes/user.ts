export default {
  // Attributes that can be send to the owner
  ownerSafe: [
    '_id',
    '_rev',
    'type',
    'username',
    'stableUsername',
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
    'fediversable',
    'customProperties',
    'snapshot',
  ],

  public: [
    '_id',
    'username',
    'stableUsername',
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
    'snapshot',
  ],

  // Attributes that need availability check before update
  concurrencial: [
    'username',
    'email',
  ],

  // Attributes that can be changed with a simple validity check
  updatable: [
    'picture',
    'language',
    'bio',
    'settings',
    'position',
    'fediversable',
    'summaryPeriodicity',
    'customProperties',
  ],

  // Attributes that are kept after a user deleted her account
  critical: [
    '_id',
    '_rev',
    'created',
    'username',
    'stableUsername',
  ],

  // Attributes to keep in documents where a stakeholder might loose
  // access to those data
  // ex: in a transaction, when the user was deleted
  // The _id is already recorded by a transaction
  // thus its absence here as long as only transactions doc uses snaphshot
  snapshot: [
    'username',
    'picture',
  ],

  acceptNullValue: [
    'position',
    'picture',
  ],

  creationStrategies: [ 'local' ],

  settings: {
    notifications: [
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
      'group_join_request',

      // TRANSACTIONS
      'your_item_was_requested',
      'update_on_your_item',
      'update_on_item_you_requested',
    ],
    contributions: [
      'anonymize',
    ],
  },

  roles: [ 'admin', 'dataadmin' ],
}
