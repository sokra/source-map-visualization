require("jquery-hashchange");
var SourceMap = require("source-map");
var UglifyJS = require("./uglify-js");

var exampleKinds = ["coffee", "simple-coffee", "coffee-redux", "simple-coffee-redux", "typescript"];
var LINESTYLES = 5;

$(function() {
	require("bootstrap");
	require("./app.less");
	$("body").html(require("./app.jade")({kinds: exampleKinds}));

	var oldHash = "";
	$(".close").click(function() {
		window.location.hash = oldHash;
	});

	$(window).hashchange(function() {
		var exampleKind = window.location.hash.replace(/^#/, "");

		if(exampleKind !== "custom-choose")
			$(".custom-modal").modal("hide");

		if(exampleKind.indexOf("base64") === 0) {
			var input = exampleKind.split(",").map(atob);
			input.shift(); // === "base64"
			var gen = input.shift();
			var map = JSON.parse(input.shift());
			loadExample(input, gen, map);
			oldHash = exampleKind;
			return;
		}
		exampleKind = exampleKind.toLowerCase();
		if(exampleKind === "custom") return;
		if(exampleKind === "custom-choose") {

			$(".custom-modal .modal-body").html(require("./custom-step1.jade")());
			$(".custom-modal").modal({
				show: true
			});
			$(".custom-error").addClass("hide");

			var generatedSource, sourceMap, sourcesContent = [];
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
			var sourceMappingUrlRegExp = /\/\/[@#]\s*sourceMappingURL\s*=\s*data:.*?base64,(.*)/;
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
							if(!_sourceMap.sources) throw new Error("SourceMap has no sources field");
							if(!_sourceMap.mappings) throw new Error("SourceMap has no mappings field");
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
				if(!sourceMap.sources || !sourceMap.mappings) {
					return $(".custom-error")
						.removeClass("hide")
						.text("This is not a valid SourceMap.");
				}
				if(sourceMap.sourcesContent) {
					sourcesContent = sourceMap.sourcesContent;
					return step4();
				}
				var sourceFile, sourceFileIndex;
				for(var i = 0; i < sourceMap.sources.length; i++) {
					if(!sourcesContent[i]) {
						sourceFile = sourceMap.sources[i];
						sourceFileIndex = i;
						break;
					}
				}
				if(i == sourceMap.sources.length) return step4();
				$(".custom-modal .modal-body").html(require("./custom-step3.jade")({
					generatedSource: generatedSource,
					sourceMap: sourceMap,
					source: sourceFile
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
						sourcesContent[sourceFileIndex] = _originalSource;
						return step3();
					});
				});
			}
			function step4() {
				try {
					loadExample(sourcesContent, generatedSource, sourceMap)
					$(".custom-modal").modal("hide");
					oldHash = window.location.hash = "custom";
					$(".custom-link").attr("href", "#base64," + [generatedSource, JSON.stringify(sourceMap)].concat(sourcesContent).map(btoa).join(",")).text("Link to this");
				} catch(e) {
					$(".custom-error").removeClass("hide").text(e.message);
					console.error(e.stack);
					return $(".custom-continue").attr("disabled", false);
				}
			}

		} else {
			if(exampleKinds.indexOf(exampleKind) < 0) exampleKind = "typescript";
			var exampleJs = require("!raw!../example/"+exampleKind+"/example.js");
			var exampleMap = require("!json!../example/"+exampleKind+"/example.map");
			var sources = exampleMap.sourcesContent;
			if(!sources) {
				sources = [require("!raw!../example/"+exampleKind+"/example")];
			}
			loadExample(sources, exampleJs, exampleMap);
			$(".custom-link").text("");
			oldHash = exampleKind;
		}
	});
	$(window).hashchange();

  function isGenerated(file) {
    return file.name.substr(-3) === ".js";
  }

  function isSourceMap(file) {
    return file.name.substr(-5) === ".json" ||
      file.name.substr(-4) === ".map";
  }

  function isSource(file) {
    return !isGenerated(file) && !isSourceMap(file);
  }

  function reduce(fn, initial, arrayLike) {
    return Array.prototype.reduce.call(arrayLike, fn, initial)
  }

  $(window).on("dragenter dragover", function(e) {
    $(this).toggleClass('drop-target');
    return false;
  }).on("drop", function(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.originalEvent.dataTransfer.files;
    if (files.length === 3) {
      var example = reduce(function(result, file) {
        if (isGenerated(file)) result.generated = file;
        if (isSourceMap(file)) result.map = file;
        else result.source = file;
        return result;
      }, {}, files);

      readFile(example.generated, function(error, generated) {
        if (error) return;
        readFile(example.map, function(error, map) {
          if (error) return;
          readFile(example.source, function(error, source) {
            console.log(source, generated, map);
            loadExample([source], generated, JSON.parse(map));
          });
        });
      });
    }
    return false;
  });

	function loadExample(sources, exampleJs, exampleMap) {
		exampleMap.file = exampleMap.file || "example.js";
		var map = new SourceMap.SourceMapConsumer(exampleMap);

		var generated = $(".generated").text("");
		var original = $(".original").text("");
		var mappings = $(".mappings").text("1: ");

		var nodes = SourceMap.SourceNode.fromStringWithSourceMap(exampleJs, map).children;
		nodes.forEach(function(item) {
			if(typeof item === "string") {
				generated.append($("<span>").text(item));
			} else {
				var str = item.toString();
				var source = map.sources.indexOf(item.source);
				generated.append($("<span>")
					.addClass("generated-item")
					.addClass("item-" + source + "-" + item.line + "-" + item.column)
					.attr("title", item.name)
					.data("source", source)
					.data("line", item.line)
					.data("column", item.column)
					.addClass("style-" + (item.line%LINESTYLES))
					.text(str));
			}
		});
		var lastGenLine = 1;
		var lastOrgSource = "";
		map.eachMapping(function(mapping) {
			while(lastGenLine < mapping.generatedLine) {
				mappings.append($("<br>"));
				lastGenLine++;
				mappings.append($("<span>").text(lastGenLine + ": "));
			}
			if(typeof mapping.originalLine == "number") {
				if(lastOrgSource !== mapping.source && map.sources.length > 1) {
					mappings.append($("<span>").text("[" + mapping.source + "] "));
					lastOrgSource = mapping.source;
				}
				var source = map.sources.indexOf(mapping.source);
				mappings.append(
					$("<span>")
						.text(mapping.generatedColumn + "->" + mapping.originalLine + ":" + mapping.originalColumn)
						.addClass("mapping-item")
						.addClass("item-" + source + "-" + mapping.originalLine + "-" + mapping.originalColumn)
						.data("source", source)
						.data("line", mapping.originalLine)
						.data("column", mapping.originalColumn)
						.addClass("style-" + (mapping.originalLine%LINESTYLES))
				);
			} else
				mappings.append($("<span>").text(mapping.generatedColumn).addClass("mapping-item"));
			mappings.append($("<span>").text("  "));
		});
		var line = 1, column = 0;
		var lastMapping = null;
		var currentSource = null;
		var exampleLines;
		map.eachMapping(function(mapping) {
			if(typeof mapping.originalLine !== "number") return;
			if(currentSource !== mapping.source) {
				if(currentSource) endFile();
				lastMapping = null;
				line = 1;
				column = 0;
				if(map.sources.length > 1)
					original.append($("<h4>")
						.text(mapping.source));
				exampleLines = sources[map.sources.indexOf(mapping.source)].split("\n");
				currentSource = mapping.source;
			}
			if(lastMapping) {
				var source = map.sources.indexOf(lastMapping.source);
				if(line < mapping.originalLine) {
					original.append($("<span>")
						.addClass("original-item")
						.addClass("item-" + source + "-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
						.data("source", source)
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
						.addClass("item-" + source + "-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
						.data("source", source)
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
		function endFile() {
			if(lastMapping) {
				var source = map.sources.indexOf(lastMapping.source);
				original.append($("<span>")
					.addClass("original-item")
					.addClass("item-" + source + "-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
					.data("source", source)
					.data("line", lastMapping.originalLine)
					.data("column", lastMapping.originalColumn)
					.addClass("style-" + (lastMapping.originalLine%LINESTYLES))
					.text(exampleLines.shift()));
			}
		}
		endFile();
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
			var source = $(this).data("source");
			var line = $(this).data("line");
			var column = $(this).data("column");
			$(".item-" + source + "-" + line + "-" + column).addClass("selected");
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
				minmap.setSourceContent("?", exampleJs);
				map.sourcesContent = sources;
				minmap.applySourceMap(map, "?");
				minmap = minmap.toJSON();
				var idx = minmap.sources.indexOf("?");
				if(idx >= 0) {
					var name = "example.js";
					while(minmap.sources.indexOf(name) >= 0)
						name += "*";
					minmap.sources[idx] = name;
				}

				loadExample(minmap.sourcesContent, result.code, minmap);
				oldHash = window.location.hash = "custom";
			}));
	}
});

function readFile(file, callback) {
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

function loadFile(fileInput, callback) {
	var file = $(fileInput)[0].files[0];
	if (!file) return callback();
  readFile(file, callback);
}