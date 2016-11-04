module.exports = {
  input: "elements/styles/index.css",
  output: "elements/lib/styles.css",
  use: [ 'postcss-import',
          'autoprefixer',
                'postcss-custom-properties',
                'postcss-color-function' ]
};