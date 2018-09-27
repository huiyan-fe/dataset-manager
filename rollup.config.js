import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

var minify = process.env.NODE_ENV === 'release'

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleName: 'DataSetManager',
  plugins: [
    (minify && uglify()),
  ],
  dest: minify ? 'dist/DataSetManager.min.js' : 'dist/DataSetManager.js',
}
