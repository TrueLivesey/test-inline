module.exports = {
  root: true,
  extends: ['airbnb-base', 'eslint:recommended', 'plugin:jest/recommended', 'prettier'],
  env: {
    browser: true,
    es2021: true,
    'jest/globals': true,
  },
  rules: {
    'prefer-const': 0,
    'no-alert': 0,
    'no-param-reassign': [2, { props: false }],
    'no-plusplus': 0,
    'no-iterator': 0,
    'no-restricted-syntax': [2, 'WithStatement'],
    'func-style': 0,
    'no-var': 'error',
    'prettier/prettier': 'error',
  },
  plugins: ['cypress', 'prettier'],
};
