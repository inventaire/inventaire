// This config file is used by eslint
// See package.json scripts: lint*
// Rules documentation: https://eslint.org/docs/rules/
// Inspect the generated config:
//    eslint --print-config .eslintrc.cjs
module.exports = {
  root: true,
  extends: [
    // See https://github.com/standard/eslint-config-standard/blob/master/.eslintrc.json
    'standard',
  ],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
    },
  },
  plugins: [
    'node-import',
  ],
  rules: {
    'array-bracket-spacing': [ 'error', 'always' ],
    'arrow-parens': [ 'error', 'as-needed' ],
    'comma-dangle': [ 'error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    } ],
    eqeqeq: [ 'error', 'smart' ],
    'implicit-arrow-linebreak': [ 'error', 'beside' ],
    'import/newline-after-import': 'error',
    'import/order': [
      'error',
      {
        pathGroups: [
          { pattern: '#*/**', group: 'internal', position: 'before' },
        ],
        groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling' ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc' },
      },
    ],
    indent: [ 'error', 2, { MemberExpression: 'off' } ],
    'no-ex-assign': [ 'off' ],
    'no-var': [ 'error' ],
    'node-import/prefer-node-protocol': 2,
    'nonblock-statement-body-position': [ 'error', 'beside' ],
    'object-curly-spacing': [ 'error', 'always' ],
    'object-shorthand': [ 'error', 'properties' ],
    'one-var': [ 'off' ],
    'prefer-arrow-callback': [ 'error' ],
    'prefer-const': [ 'error' ],
  },
}
