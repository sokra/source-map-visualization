var UglifyJS = require("./uglify-js.loader.js!");

UglifyJS.minify = function(files, options) {
    options = UglifyJS.defaults(options, {
        outSourceMap : null,
        sourceRoot   : null,
        warnings     : false,
        mangle       : {},
        output       : null,
        compress     : {}
    });
    if (typeof files == "string")
        files = [ files ];

    // 1. parse
    var toplevel = null;
    files.forEach(function(file){
        var code = file;
        toplevel = UglifyJS.parse(code, {
            filename: "?",
            toplevel: toplevel
        });
    });

    // 2. compress
    if (options.compress) {
        var compress = { warnings: options.warnings };
        UglifyJS.merge(compress, options.compress);
        toplevel.figure_out_scope();
        var sq = UglifyJS.Compressor(compress);
        toplevel = toplevel.transform(sq);
    }

    // 3. mangle
    if (options.mangle) {
        toplevel.figure_out_scope();
        toplevel.compute_char_frequency();
        toplevel.mangle_names(options.mangle);
    }

    // 4. output
    var map = null;
    if (options.outSourceMap) map = UglifyJS.SourceMap({
        file: options.outSourceMap,
        root: options.sourceRoot
    });
    var output = { source_map: map };
    if (options.output) {
        UglifyJS.merge(output, options.output);
    }
    var stream = UglifyJS.OutputStream(output);
    toplevel.print(stream);
    return {
        code : stream + "",
        map  : map + ""
    };
};

module.exports = UglifyJS;
