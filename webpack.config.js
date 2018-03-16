const path = require('path')
const webpack = require('webpack')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const WebpackBuildNotifierPlugin = require('webpack-build-notifier')

const config = {
	entry: './assets/js/app.js',
	output: {
		filename: 'js/app.js',
		path: path.resolve(__dirname, './public/assets/dist'),
		publicPath: '/',
	},
	resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
			'@': path.resolve(__dirname, '.')
    }
  },
	module: {
		rules: [
			{
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
					loaders: {
			      scss: 'vue-style-loader!css-loader!sass-loader', // <style lang="scss">
			      sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax' // <style lang="sass">
			    }
        }
      },
			{
				test: /\.scss$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [ 'css-loader', 'postcss-loader', 'sass-loader' ]
				})
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [ 'css-loader' ]
				})
			},
			{
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
					name: '[path][name].[ext]',
					useRelativePath: false,
					emitFile: false //Prevents files from moving since they're correctly referenced
        }
      },
			{
				test: /\.js$/,
				include: [
					path.resolve(__dirname, 'assets/js'),
					path.resolve(__dirname, 'node_modules/foundation-sites/js')
				],
				loader: 'babel-loader',
				options: {
					presets: ['env']
				}
			}
		],
	},
	plugins: [
		new WebpackBuildNotifierPlugin({
			sound: 'Funk',
			successSound: 'Pop'
		}),
		new BrowserSyncPlugin({
			host: 'localhost',
      port: 3000,
			server: true,
      files: [
        '**/*.html'
      ]
		}),
		new ExtractTextPlugin({
			filename: 'css/[name].css',
			// publicPath: '/'
		})
	],
	devtool: 'source-map'
};

if (process.env.NODE_ENV === 'production') {
	config.plugins.push(
		new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
		new UglifyJSPlugin({
			sourceMap: true,
		}),
		new OptimizeCssAssetsPlugin()
	)
}

module.exports = config
