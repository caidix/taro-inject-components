
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./taro-loader-component-inject.cjs.production.min.js')
} else {
  module.exports = require('./taro-loader-component-inject.cjs.development.js')
}
