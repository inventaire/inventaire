/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should');
const { authReq, authReqB, undesiredErr } = require('../utils/utils');
const { newItemBase } = require('./helpers');

describe('items:bulk-update', function() {
  it('should update an item details', function(done){
    authReq('post', '/api/items', newItemBase())
    .then(function(item){
      const newTransaction = 'lending';
      item.transaction.should.not.equal(newTransaction);
      const ids = [ item._id ];
      return authReq('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: newTransaction
      }).then(function(res){
        res.ok.should.be.true();
        return authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
        .get('items')
        .then(function(updatedItems){
          updatedItems[0].transaction.should.equal(newTransaction);
          return done();
        });
      });}).catch(undesiredErr(done));

  });

  return it('should not update an item from another owner', function(done){
    authReq('post', '/api/items', newItemBase())
    .then(function(item){
      const ids = [ item._id ];
      return authReqB('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: 'lending'
      }).catch(function(err){
        err.statusCode.should.equal(400);
        err.body.status_verbose.should.startWith('user isnt item.owner');
        return done();
      });}).catch(undesiredErr(done));

  });
});
