/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { authReq, getUser, undesiredErr } = require('../utils/utils');
const { newItemBase, CountChange } = require('./helpers');
const debounceDelay = CONFIG.itemsCountDebounceTime + 100;

describe('items:update', function() {
  it('should update an item', function(done){
    authReq('post', '/api/items', newItemBase())
    .then(function(item){
      let newDetails, newTransaction;
      item.transaction = (newTransaction = 'lending');
      item.details = (newDetails = 'hello');
      return authReq('put', '/api/items', item)
      .then(function(updatedItem){
        updatedItem.transaction.should.equal(newTransaction);
        updatedItem.details.should.equal(newDetails);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should not be able to update non updatable attributes', function(done){
    authReq('post', '/api/items', newItemBase())
    .then(function(item){
      item.busy = true;
      return authReq('put', '/api/items', item)
      .then(function(updatedItem){
        should(updatedItem.busy).not.be.ok();
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should trigger an update of the users items counters', function(done){
    authReq('post', '/api/items', newItemBase())
    // Delay to let the time to the item counter to be updated
    .delay(debounceDelay)
    .then(item => getUser()
    .then(function(userBefore){
      let newListing;
      item.listing.should.equal('private');
      item.listing = (newListing = 'public');
      return authReq('put', '/api/items', item)
      // Delay to request the user after its items count was updated
      .delay(debounceDelay)
      .then(function(updatedItem){
        updatedItem.listing.should.equal(newListing);
        return getUser()
        .then(function(userAfter){
          const countChange = CountChange(userBefore.snapshot, userAfter.snapshot);
          countChange('private').should.equal(-1);
          countChange('network').should.equal(0);
          countChange('public').should.equal(1);
          return done();
        });
      });
    })).catch(undesiredErr(done));

  });
});
