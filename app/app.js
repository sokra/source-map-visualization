var SourceMap = require("source-map");
var UglifyJS = require("./uglify-js");

var exampleKinds = ["minimize", "beautify", "coffee", "simple-coffee", "coffee-redux", "simple-coffee-redux", "typescript"];
var LINESTYLES = 5;

$(function() {
	require("bootstrap");
	require("./app.less");
	$("body").html(require("./app.jade")({kinds: exampleKinds}));

	var example = require("!raw!../example/typescript/example");
	var exampleJs = require("!raw!../example/typescript/example.js");
	var exampleMap = require("!json!../example/typescript/example.map");
	loadExample(example, exampleJs, exampleMap);

	$(".example").click(function() {
		var exampleKind = $(this).data("example");
		var example = require("!raw!../example/"+exampleKind+"/example");
		var exampleJs = require("!raw!../example/"+exampleKind+"/example.js");
		var exampleMap = require("!json!../example/"+exampleKind+"/example.map");
		loadExample(example, exampleJs, exampleMap);
	});

	$(".custom-modal").modal({
		show: false
	});

	$(".custom").click(function() {
		$(".custom-modal .modal-body").html(require("./custom-step1.jade")());
		$(".custom-modal").modal("show");

		var generatedSource, sourceMap, originalSource;
		$(".custom-continue").click(function() {
			$(".custom-continue").attr("disabled", true);
			loadFile($(".file"), function(err, _generatedSource) {
				$(".custom-error").addClass("hide");
				if(err) {
					$(".custom-error").removeClass("hide").text(err.message);
					return $(".custom-continue").attr("disabled", false);
				}
				if(!_generatedSource)
					return $(".custom-continue").attr("disabled", false);
				generatedSource = _generatedSource;
				step2();
			});
			return false;
		});
		var sourceMappingUrlRegExp = /\/\/@\s*sourceMappingURL\s*=\s*data:.*base64,(.*)/;
		function step2() {
			if(sourceMappingUrlRegExp.test(generatedSource) && typeof atob == "function") {
				var match = sourceMappingUrlRegExp.exec(generatedSource);
				try {
					sourceMap = JSON.parse(atob(match[1]));
					return step3();
				} catch(e) {}
			}
			$(".custom-modal .modal-body").html(require("./custom-step2.jade")({
				generatedSource: generatedSource
			}));
			$(".custom-continue").click(function() {
				loadFile($(".file"), function(err, _sourceMap) {
					$(".custom-error").addClass("hide");
					if(err) {
						$(".custom-error").removeClass("hide").text(err.message);
						return $(".custom-continue").attr("disabled", false);
					}
					try {
						_sourceMap = JSON.parse(_sourceMap);
					} catch(e) {
						$(".custom-error").removeClass("hide").text(e.message);
						_sourceMap = false;
					}
					if(!_sourceMap)
						return $(".custom-continue").attr("disabled", false);
					sourceMap = _sourceMap;
					step3();
				});
			});
		}
		function step3() {
			if(sourceMap.sourcesContent && sourceMap.sourcesContent.length == 1) {
				originalSource = sourceMap.sourcesContent[0];
				return step4();
			}
			$(".custom-modal .modal-body").html(require("./custom-step3.jade")({
				generatedSource: generatedSource,
				sourceMap: sourceMap
			}));
			$(".custom-continue").click(function() {
				loadFile($(".file"), function(err, _originalSource) {
					$(".custom-error").addClass("hide");
					if(err) {
						$(".custom-error").removeClass("hide").text(err.message);
						return $(".custom-continue").attr("disabled", false);
					}
					if(!_originalSource)
						return $(".custom-continue").attr("disabled", false);
					originalSource = _originalSource;
					return step4();
				});
			});
		}
		function step4() {
			try {
				if(sourceMap.sources.length > 1)
					throw new Error("This tool can only process SourceMaps with a single source file.\n" +
						"This SourceMap has multiple sources: " + sourceMap.sources.join(", "));
				loadExample(originalSource, generatedSource, sourceMap)
				$(".custom-modal").modal("hide");
			} catch(e) {
				$(".custom-error").removeClass("hide").text(e.message);
				return $(".custom-continue").attr("disabled", false);
			}
		}
		return false;
	});

	function loadExample(example, exampleJs, exampleMap) {
		exampleMap.file = exampleMap.file || "example.js";
		var map = new SourceMap.SourceMapConsumer(exampleMap);

		var generated = $(".generated").text("");
		var original = $(".original").text("");
		var mappings = $(".mappings").text("1: ");

		if(exampleJs.substr(0, 1) == "\n" || exampleJs.substr(0, 1) == "\r") {
			generated.append($("<button>")
				.addClass("btn btn-danger")
				.text("remove first line")
				.attr("title", "What would happen if this line has be removed?")
				.click(function() {
					loadExample(example, exampleJs.replace(/^\r?\n?/, ""), exampleMap);
				}));
		}

		var nodes = SourceMap.SourceNode.fromStringWithSourceMap(exampleJs, map).children;
		nodes.forEach(function(item) {
			if(typeof item === "string") {
				generated.append($("<span>").text(item));
			} else {
				var str = item.toString();
				generated.append($("<span>")
					.addClass("generated-item")
					.addClass("item-" + item.line + "-" + item.column)
					.attr("title", item.name)
					.data("line", item.line)
					.data("column", item.column)
					.addClass("style-" + (item.line%LINESTYLES))
					.text(str));
			}
		});
		var exampleLines = example.split("\n");
		var lastGenLine = 1;
		map.eachMapping(function(mapping) {
			while(lastGenLine < mapping.generatedLine) {
				mappings.append($("<br>"));
				lastGenLine++;
				mappings.append($("<span>").text(lastGenLine + ": "));
			}
			if(typeof mapping.originalLine == "number")
				mappings.append(
					$("<span>")
						.text(mapping.generatedColumn + "->" + mapping.originalLine + ":" + mapping.originalColumn)
						.addClass("mapping-item")
						.addClass("item-" + mapping.originalLine + "-" + mapping.originalColumn)
						.data("line", mapping.originalLine)
						.data("column", mapping.originalColumn)
						.addClass("style-" + (mapping.originalLine%LINESTYLES))
				);
			else
				mappings.append($("<span>").text(mapping.generatedColumn).addClass("mapping-item"));
			mappings.append($("<span>").text("  "));
		});
		var line = 1, column = 0;
		var lastMapping = null;
		map.eachMapping(function(mapping) {
			if(typeof mapping.originalLine !== "number") return;
			if(lastMapping) {
				if(line < mapping.originalLine) {
					original.append($("<span>")
						.addClass("original-item")
						.addClass("item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
						.data("line", lastMapping.originalLine)
						.data("column", lastMapping.originalColumn)
						.addClass("style-" + (lastMapping.originalLine%LINESTYLES))
						.text(exampleLines.shift() + "\n"));
					line++; column = 0;
					while(line < mapping.originalLine) {
						original.append($("<span>").text(exampleLines.shift() + "\n"));
						line++; column = 0;
					}
					if(column < mapping.originalColumn) {
						original.append($("<span>").text(shiftColumns(mapping.originalColumn - column)));
					}
				}
				if(mapping.originalColumn > column) {
					original.append($("<span>")
						.addClass("original-item")
						.addClass("item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
						.data("line", lastMapping.originalLine)
						.data("column", lastMapping.originalColumn)
						.addClass("style-" + (lastMapping.originalLine%LINESTYLES))
						.text(shiftColumns(mapping.originalColumn - column)));
				}
			} else {
				while(line < mapping.originalLine) {
					original.append($("<span>").text(exampleLines.shift() + "\n"));
					line++; column = 0;
				}
				if(column < mapping.originalColumn) {
					original.append($("<span>").text(shiftColumns(mapping.originalColumn - column)));
				}
			}
			lastMapping = mapping;
		}, undefined, SourceMap.SourceMapConsumer.ORIGINAL_ORDER);
		if(lastMapping) {
			original.append($("<span>")
				.addClass("original-item")
				.addClass("item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
				.data("line", lastMapping.originalLine)
				.data("column", lastMapping.originalColumn)
				.addClass("style-" + (lastMapping.originalLine%LINESTYLES))
				.text(exampleLines.shift()));
		}
		exampleLines.forEach(function(line) {
			original.append($("<span>").text("\n" + line));
		});

		function shiftColumns(count) {
			var nextLine = exampleLines[0];
			exampleLines[0] = nextLine.substr(count);
			column += count;
			return nextLine.substr(0, count);
		}

		$("body").delegate(".original-item, .generated-item, .mapping-item", "mouseenter", function() {
			$(".selected").removeClass("selected");
			var line = $(this).data("line");
			var column = $(this).data("column");
			$(".item-" + line + "-" + column).addClass("selected");
		});

		generated.append($("<br>"));
		generated.append($("<br>"));
		generated.append($("<button>")
			.addClass("btn btn-primary")
			.text("minimize")
			.attr("title", "Minimize the file with uglify-js and combine the SourceMaps.")
			.click(function() {
				var result = UglifyJS.minify(exampleJs, {
					outSourceMap: "example.map",
				});
				var minmap = JSON.parse(result.map);
				minmap.file = "example";
				minmap = new SourceMap.SourceMapConsumer(result.map);
				minmap = SourceMap.SourceMapGenerator.fromSourceMap(minmap);
				minmap.applySourceMap(map, "?");
				try {
					minmap.removeSource("?");
				} catch(e) {}
				minmap = minmap.toJSON();

				loadExample(example, result.code, minmap);
			}));
	}
});

function loadFile(fileInput, callback) {
	var file = $(fileInput)[0].files[0];
	if(!file) return callback();
	var fileReader = new FileReader();
	fileReader.readAsText(file, "utf-8");
	fileReader.onload = function(e) {
		callback(null, fileReader.result);
	};
    fileReader.onprogess = function(evt) {
		if (evt.lengthComputable) {
			var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
			if (percentLoaded < 100) {
				$(".read-progress").css("width", percentLoaded + "%");
			}
		}
	};
    fileReader.onabort = function(e) {
		return callback(new Error('File read cancelled'));
    };
	fileReader.onerror = function(evt) {
		switch(evt.target.error.code) {
			case evt.target.error.NOT_FOUND_ERR:
				return callback(new Error('File Not Found!'));
			case evt.target.error.NOT_READABLE_ERR:
				return callback(new Error('File is not readable'));
			case evt.target.error.ABORT_ERR:
				return callback();
			default:
				return callback(new Error('An error occurred reading this file.'));
		}
	};
}