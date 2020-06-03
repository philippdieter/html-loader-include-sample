const {getIfUtils, removeEmpty}     = require('webpack-config-utils');
const HtmlWebpackPlugin             = require('html-webpack-plugin');
const path                          = require('path');
const TerserPlugin                  = require('terser-webpack-plugin');
const webpack                       = require('webpack');
const _                             = require('lodash');

const posthtml = require('posthtml');
const posthtmlInclude = require('posthtml-include');

module.exports = env => {
  const { ifProd, ifNotProd } = getIfUtils(env);

  var htmlPlugins = [];
  htmlPlugins.push(
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      filetype: 'pug',
      template: './src/file1.pug',
      minify: false,
      title: 'Test title',
      filename: 'webroot/file1.html'
    })
  );

  return {
    mode: ifProd('production', 'development'),
    module: {
      rules: [
        {
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: ['syntax-dynamic-import'],
            presets: [
              [
                '@babel/preset-env',
                {
                  modules: false
                }
              ]
            ]
          },
          test: /\.js$/
        },
        {
          test: /\.coffee$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: ['syntax-dynamic-import'],
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false
                    }
                  ]
                ]
              },
            },
            'coffee-loader',
          ]
        },
        {
          test: /\.pug$/,
          oneOf: [
            {
              exclude: /\.vue$/,
              use: [
                {
                  loader: 'html-loader',
                  options: {
                    preprocessor: (content, loaderContext) => {
                      let result;
                      try {
                        result = posthtml([posthtmlInclude()]).process(content, { sync: true });
                      } catch (error) {
                        loaderContext.emitError(error);
                        return content;
                      }
                      return result.html;
                    },
                  },
                },
                {
                  loader: 'pug-plain-loader',
                  options: {
                    doctype: 'html5',
                  },
                },
              ]
            },
          ]
        },
      ]
    },
    plugins: htmlPlugins.concat(removeEmpty([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: ifProd('"production"', '"development"')
        }
      }),
    ])),
    entry: {
      site: [
        './src/main.js',
      ],
    },
    resolve: {
      alias: {
        'vue$':    'vue/dist/vue.esm.js',
      },
    },
    output: {
      filename: 'assets/[name].[chunkhash].js',
      path: path.resolve(__dirname)
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            priority: -10,
            test: /[\\/]node_modules[\\/]/
          },
        },
        chunks: 'async',
        minChunks: 1,
        minSize: 30000,
        name: true
      },
      minimizer: [new TerserPlugin()],
    },
    devtool: ifProd(false, 'source-map'),
  }
};
