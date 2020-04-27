module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        paths: ['./src'],
        extensions: [
          '.ts',
          '.js',
        ],
      },
      'babel-module': {
        cwd: 'packagejson',
      },
    },
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
    'max-len': [
      'error',
      {
        code: 120,
      },
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
        maxEOF: 1,
      },
    ],
    'semi-style': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-filename-extension': 'error',
    'react/prop-types': 'off',
    'func-names': [
      'error',
      'always',
      {
        'generators': 'as-needed',
      },
    ],
    'object-curly-newline': ['error', {
      multiline: true,
      minProperties: 2,
    }],
  },
};
