module.exports = {
  publicPath: '/',

  // where to output built files
  outputDir: 'dist',

  devServer: {
    inline: false,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:' + process.env.IIOS_SERVER_PORT + '/socket.io',
        ws: true
      },
      '/api': {
        target: 'http://localhost:' + process.env.IIOS_SERVER_PORT,
      }
    },
    https: false
  },

  configureWebpack: {
    output: {
      publicPath: '/',
      filename: 'build.js'
    },
    entry: {
      app: './test/main.js'
    }
  }
}
