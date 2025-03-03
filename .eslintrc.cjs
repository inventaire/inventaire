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
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
    },
  },
  plugins: [
    'node-import',
    '@stylistic/ts',
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
        groups: [ 'builtin', 'external', 'internal', 'parent', 'sibling', 'object', 'type' ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc' },
      },
    ],
    indent: [ 'error', 2, { MemberExpression: 'off' } ],
    'no-ex-assign': [ 'off' ],
    'no-var': [ 'error' ],
    'node-import/prefer-node-protocol': 2,
    'nonblock-statement-body-position': [ 'error', 'beside' ],
    'object-shorthand': [ 'error', 'properties' ],
    'one-var': [ 'off' ],
    'prefer-arrow-callback': [ 'error' ],
    // Rule disabled for IDEs, as its annoying to get `let` turned into `const` on save,
    // before having the time to write the code that would reassign the variable.
    // But this rule is then on in .eslintrc.cli.cjs
    'prefer-const': [ 'off' ],
    '@stylistic/ts/type-annotation-spacing': 'error',
    '@stylistic/ts/space-infix-ops': 'error',
    '@stylistic/ts/object-curly-spacing': [ 'error', 'always' ],
    '@stylistic/ts/keyword-spacing': 'error',
    '@stylistic/ts/indent': [ 'error', 2, { MemberExpression: 'off' } ],
    '@stylistic/ts/member-delimiter-style': [ 'error', { multiline: { delimiter: 'none' }, singleline: { delimiter: 'comma', requireLast: false } } ],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': [ 'error', { prefer: 'type-imports' } ],
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
