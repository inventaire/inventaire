module.exports = {
  byEntityId: {
    map: doc => {
      emit(doc._id.split(':')[0], null)
    }
  },
  byUserId: {
    map: doc => emit([ doc.user, doc.timestamp ], null),
    reduce: '_count'
  },
  byDate: {
    map: doc => emit(doc.timestamp, null)
  },
  byDay: {
    map: doc => {
      const day = new Date(doc.timestamp).toISOString().split('T')[0]
      emit([ day, doc.user ], null)
    },
    reduce: '_count'
  },
  byRedirectUri: {
    map: doc => {
      if (doc.context != null && doc.context.redirectClaims != null) {
        emit(doc.context.redirectClaims.fromUri, null)
      }
    }
  },
  byClaimValueAndDate: {
    map: `
      function emitEntityClaim (property, claimValue, timestamp) {
        if (typeof claimValue === 'string' && (claimValue.startsWith('wd:') || claimValue.startsWith('inv:'))) {
          emit([ claimValue, timestamp ], property)
        }
      }

      function (doc) {
        const { timestamp } = doc
        for (const operation of doc.patch) {
          if (operation.op === 'add') {
            const [ , section, property, arrayIndex ] = operation.path.split('/')
            if (section === 'claims') {
              if (arrayIndex != null) {
                emitEntityClaim(property, operation.value, timestamp)
              } else if (property != null) {
                for (const subvalue of operation.value) {
                  emitEntityClaim(property, subvalue, timestamp)
                }
              }
            }
          }
        }
      }`,
    reduce: '_count'
  }
}
