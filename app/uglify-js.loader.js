module.exports = function() {
	this.cacheable();
	var files = [
		require.resolve("uglify-js/lib/utils.js"),
		require.resolve("uglify-js/lib/ast.js"),
		require.resolve("uglify-js/lib/parse.js"),
		require.resolve("uglify-js/lib/transform.js"),
		require.resolve("uglify-js/lib/scope.js"),
		require.resolve("uglify-js/lib/output.js"),
		require.resolve("uglify-js/lib/compress.js"),
		require.resolve("uglify-js/lib/sourcemap.js"),
		require.resolve("uglify-js/lib/mozilla-ast.js")
	];
	files = files.map(function(file) {
		return require("fs").readFileSync(file, "utf-8");
	}).join("\n\n");
	var uglify = [
		'"use scrict";',
		'var MOZ_SourceMap = require("source-map");',
		files,
		"module.exports = {",
		"defaults parse Compressor SourceMap merge OutputStream".split(" ")
		.map(function(item) {
			return item + ":" + item;
		}).join(","),
		"};"
	];
	return uglify.join("\n");
};
