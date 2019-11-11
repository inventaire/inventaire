/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { undesiredErr } = __.require('apiTests', 'utils/utils');
const { createTransaction } = require('../fixtures/transactions');
const { authReq, authReqB } = __.require('apiTests', 'utils/utils');


describe('transactions:update-state', () => it('should update state and apply side effects', function(done){
  createTransaction()
  .then(function(transactionRes){
    const { transaction, userA, userB, userBItem } = transactionRes;
    return authReqB('put', '/api/transactions?action=update-state', {
      transaction: transaction._id,
      state: 'accepted'
    })
    .then(function(updateRes){
      updateRes.ok.should.be.true();
      return done();
    });}).catch(undesiredErr(done));

}));
