const path = require('path'); //引入path
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    devtool:'source-map',
    entry: './src/index.js',
    output: {
    filename: './dist/table2excel.min.js',
      library: 'Table2Excel',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            'babel-loader',
          ],
          exclude: /node_modules/
        }
      ]
    },
    
    node: {
      fs: 'empty'
    },
    performance: {
      hints:false
    },
    plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
  ],
    devServer:{
      contentBase:path.resolve(__dirname,'dist'),
      host:'127.0.0.1',
      compress:true,
      port:8083
  } //  配置webpack服务
  };
  