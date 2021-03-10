const should = require('should')
const { publicReq, authReq, shouldNotBeCalled } = require('../utils/utils')
const { getNotifications } = require('../utils/notifications')
const { groupPromise, createGroup, createGroupWithAMember } = require('../fixtures/groups')
const slugify = require('controllers/groups/lib/slugify')
const endpoint = '/api/groups?action=update-settings'

describe('groups:update-settings', () => {
  it('should reject without a group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should update the group slug when updating the name', async () => {
    const { _id: groupId, name } = await groupPromise
    const updatedName = `${name}-updated`
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'name',
      value: updatedName
    })
    updateRes.ok.should.be.true()
    const { group: updatedGroup } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    updatedGroup.name.should.equal(updatedName)
    updatedGroup.slug.should.equal(slugify(updatedName))
  })

  it('should request a group slug update when updating the name', async () => {
    const { _id: groupId, name } = await groupPromise
    const updatedName = `${name}-updated-again`
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'name',
      value: updatedName
    })
    updateRes.ok.should.be.true()
    updateRes.update.slug.should.equal(slugify(updatedName))
  })

  it('should update description', async () => {
    const updatedDescription = 'Lorem ipsum dolor sit amet'
    const { _id: groupId } = await groupPromise
    const updateRes = await authReq('put', endpoint, {
      group: groupId,
      attribute: 'description',
      value: updatedDescription
    })
    updateRes.ok.should.be.true()
    Object.keys(updateRes.update).length.should.equal(0)
    const { group: updatedGroup } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    updatedGroup.description.should.equal(updatedDescription)
  })

  it('should update position', async () => {
    const { _id: groupId } = await groupPromise
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'position',
      value: [ 0.123456789, 0.123456789 ]
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.position.should.deepEqual([ 0.12346, 0.12346 ])
  })

  it('should update searchable parameter', async () => {
    const { _id: groupId, searchable } = await groupPromise
    searchable.should.be.true()
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'searchable',
      value: false
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.searchable.should.be.false()
  })

  it('should update open parameter', async () => {
    const { _id: groupId } = await createGroup()
    await authReq('put', endpoint, {
      group: groupId,
      attribute: 'open',
      value: true
    })
    const { group } = await publicReq('get', `/api/groups?action=by-id&id=${groupId}`)
    group.open.should.be.true()
  })

  describe('notifications', () => {
    it('should send a notification to groups members when updating the name', async () => {
      const { group, member } = await createGroupWithAMember()
      const { _id: groupId, name } = group
      const updatedName = `${name}-updated`
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      const notification = notifications.find(isAttributeNotification('name'))
      notification.data.attribute.should.equal('name')
      notification.data.previousValue.should.equal(name)
      notification.data.newValue.should.equal(updatedName)
    })

    it('should send a notification to groups members when updating the description', async () => {
      const { group, member } = await createGroupWithAMember()
      const { _id: groupId, description } = group
      const updatedDescription = `${description}-updated`
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'description',
        value: updatedDescription
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      const notification = notifications.find(isAttributeNotification('description'))
      notification.data.attribute.should.equal('description')
      notification.data.previousValue.should.equal(description)
      notification.data.newValue.should.equal(updatedDescription)
    })

    it('should send a notification to groups members when updating the searchable flag', async () => {
      const { group, member } = await createGroupWithAMember({ searchable: false })
      const { _id: groupId } = group
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'searchable',
        value: true
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      const notification = notifications.find(isAttributeNotification('searchable'))
      notification.data.attribute.should.equal('searchable')
      notification.data.previousValue.should.equal(false)
      notification.data.newValue.should.equal(true)
    })

    it('should send a notification to groups members when updating the open flag', async () => {
      const { group, member } = await createGroupWithAMember({ open: false })
      const { _id: groupId } = group
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'open',
        value: true
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      const notification = notifications.find(isAttributeNotification('open'))
      notification.data.attribute.should.equal('open')
      notification.data.previousValue.should.equal(false)
      notification.data.newValue.should.equal(true)
    })

    it('should keep only the latest unread notification on an updated setting (updating the old one)', async () => {
      const { group, member } = await createGroupWithAMember()
      const { _id: groupId, name: initialName } = group
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: `${initialName}-updated`
      })
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: `${initialName}-reupdated`
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      notifications.length.should.equal(1)
      const notification = notifications[0]
      notification.data.previousValue = initialName
      notification.data.newValue = `${initialName}-reupdated`
    })

    it('should delete unread notification after an updated reverses to the previous setting', async () => {
      const { group, member } = await createGroupWithAMember()
      const { _id: groupId, name: initialName } = group
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: `${initialName}-updated`
      })
      await authReq('put', endpoint, {
        group: groupId,
        attribute: 'name',
        value: initialName
      })
      const notifications = await getNotifications({ user: member, type: 'groupUpdate', subject: groupId })
      const notification = notifications.find(isAttributeNotification('name'))
      should(notification).not.be.ok()
    })
  })
})

const isAttributeNotification = attribute => ({ data }) => data.attribute === attribute
