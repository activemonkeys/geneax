/** @type {import('prettier').Config} */
const config = {
  endOfLine: 'lf',
  bracketSpacing: false,
  printWidth: 80,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-pkg',
    'prettier-plugin-tailwindcss',
  ],
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs', '*.cjs'],
      options: {
        importOrder: [
          '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
          '^(next/(.*)$)|^(next$)',
          '<THIRD_PARTY_MODULES>',
          '',
          '^@workspace/(.*)$',
          '^~/(.*)$',
          '^[./]',
        ],
        importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
        importOrderTypeScriptVersion: '5.7.3',
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve',
        parser: 'markdown',
        plugins: [],
      },
    },
    {
      files: '*.mdx',
      options: {
        parser: 'mdx',
        htmlWhitespaceSensitivity: 'ignore',
        plugins: [],
      },
    },
    {
      files: '*.json',
      options: {
        tabWidth: 4,
      },
    },
  ],
};

export default config;
