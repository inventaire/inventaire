module.exports = {
  env: {
    // env=couchdb does not exist, so taking what's the closest
    // Since CouchDB v3.1.0, views are executed in SpiderMonkey 68,
    // which corresponds to Firefox 68 features on MDN,
    // and is pretty much ES2020, to the notable exceptions of the following missing features:
    // - Optional chaining (arrives in Firefox 74)
    // - Nullish coalescing operator (arrives in Firefox 72)
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'prefer-arrow/prefer-arrow-functions': 'off',
    'no-undef': 'off',
  },
  globals: {
    emit: 'readonly',
  },
}
