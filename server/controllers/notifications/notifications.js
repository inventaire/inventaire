const __ = require('config').universalPath
const radio = __.require('lib', 'radio')

module.exports = {
  get: require('./get'),
  post: require('./update_status')
}

radio.on('notify:friend:request:accepted', require('./lib/accepted_request'))
radio.on('group:makeAdmin', require('./lib/user_made_admin'))
radio.on('group:update', require('./lib/group_update'))
// Deleting notifications when their subject is deleted
// to avoid having notification triggering requests for deleted resources
radio.on('resource:destroyed', require('./lib/delete_notifications'))
