import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

var minify = process.env.NODE_ENV === 'release'

export default {
  input: 'src/index.js',
  output: {
    file: minify ? 'dist/DataSetManager.min.js' : 'dist/DataSetManager.js',
    format: 'umd',
    name: 'DataSetManager'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    (minify && uglify()),
  ],
}
