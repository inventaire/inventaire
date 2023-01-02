import _ from '#builders/utils'
import assert_ from '#lib/utils/assert_types'
import error_ from '#lib/error/error'
import validations from './validations/listing.js'
import attributes from './attributes/listing.js'

export default {
  create: listing => {
    assert_.object(listing)
    assert_.string(listing.creator)
    assert_.string(listing.name)

    const newListing = {}
    Object.keys(listing).forEach(key => {
      const value = listing[key] || defaultValues[key]
      if (!attributes.validAtCreation.includes(key)) {
        throw error_.new(`invalid attribute: ${value}`, 400, { list: listing, key, value })
      }
      validations.pass(key, value)
      newListing[key] = value
    })

    newListing.created = Date.now()

    return newListing
  },

  updateAttributes: (oldListing, newAttributes, creatorId) => {
    assert_.object(oldListing)
    assert_.object(newAttributes)
    if (oldListing.creator !== creatorId) {
      throw error_.new('wrong user', 403, oldListing.creator)
    }
    for (const attr of Object.keys(newAttributes)) {
      if (!(attributes.updatable.includes(attr))) {
        throw error_.new(`invalid attribute: ${attr}`, 400, oldListing)
      }
    }
    const updatedListing = _.clone(oldListing)
    for (const attr of Object.keys(newAttributes)) {
      const newVal = newAttributes[attr] || defaultValues[attr]
      validations.pass(attr, newVal)
      updatedListing[attr] = newVal
    }

    if (_.isEqual(updatedListing, oldListing)) {
      throw error_.new('nothing to update', 400, newAttributes)
    }
    updatedListing.updated = Date.now()
    return updatedListing
  }
}

const defaultValues = {
  description: '',
  visibility: []
}
