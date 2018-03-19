var webpack = require("webpack");
var path = require("path");
var HtmlPlugin = require("html-webpack-plugin");

module.exports = {
	entry: "./app/app.js",
	output: {
		path: path.join(__dirname, "build"),
		filename: "bundle.js"
	},
	module: {
		loaders: [
			{ test: /\.json$/, loader: "json-loader" },
			{ test: /\.jade$/, loader: "jade-loader" },
			{ test: /\.css$/,  loader: "style-loader!css-loader" },
			{ test: /\.less$/,  loader: "style-loader!css-loader!less-loader" },
			{ test: /\.png$/,  loader: "url-loader?limit=5000&minetype=image/png" }
		]
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery"
		}),
		new HtmlPlugin({
			title: "source-map-visualization"
		})
	],
	amd: {
		jQuery: true
	},
	cache: true,
	devtool: "source-map"
};