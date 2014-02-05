require("imports?this=>window!jquery-hashchange");
var SourceMap = require("source-map");
var UglifyJS = require("./uglify-js");

var exampleKinds = ["coffee", "simple-coffee", "coffee-redux", "simple-coffee-redux", "typescript"];
var LINESTYLES = 5;
var SOURCE_MAPPING_URL_REG_EXP = /\/\/[@#]\s*sourceMappingURL\s*=\s*data:.*?base64,(.*)/;
var SOURCE_MAPPING_URL_REG_EXP2 = /\/*\s*[@#]\s*sourceMappingURL\s*=\s*data:.*?base64,(.*)\s*\*\//;

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
			$(".custom-continue").click(continueWithStep2);
			$(".file").change(continueWithStep2);
			function continueWithStep2() {
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
			}
			function step2() {
				if((SOURCE_MAPPING_URL_REG_EXP.test(generatedSource) || SOURCE_MAPPING_URL_REG_EXP2.test(generatedSource)) && typeof atob == "function") {
					var match = SOURCE_MAPPING_URL_REG_EXP.exec(generatedSource) || SOURCE_MAPPING_URL_REG_EXP2.exec(generatedSource);
					try {
						sourceMap = JSON.parse(decodeURIComponent(escape(window.atob(match[1]))));
						return step3();
					} catch(e) {}
				}
				$(".custom-modal .modal-body").html(require("./custom-step2.jade")({
					generatedSource: generatedSource
				}));
				$(".custom-continue").click(continueWithStep3);
				$(".file").change(continueWithStep3);
				function continueWithStep3() {
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
				}
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
				$(".custom-continue").click(continueWithStep4);
				$(".file").change(continueWithStep4);
				function continueWithStep4() {
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
				}
			}
			function step4() {
				try {
					loadCustomExample(sourcesContent, generatedSource, sourceMap);
					$(".custom-modal").modal("hide");
					oldHash = window.location.hash = "custom";
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

	$(window).on("dragenter dragover", function(e) {
		e.stopPropagation();
		e.preventDefault();

		var m = $(".custom-modal").data("modal");
		if(m && m.isShown) return;
		$(".custom-modal .modal-body").html(require("./custom-drag.jade")());
		$(".custom-modal").modal({
			show: true
		});
		$(".custom-error").addClass("hide");
		return false;
	});
	$(window).on("drop", function(e) {
		e.stopPropagation();
		e.preventDefault();

		var files = e.originalEvent.dataTransfer.files;
		var count = files.length;
		if(count === 0) return false;
		var filesData = Array.prototype.map.call(files, function(file) { return { file: file, name: file.name }; });
		filesData.forEach(function(data) {
			readFile(data.file, function(err, result) {
				data.err = err;
				data.result = result;
				if(--count === 0) finished();
			});
		});
		return false;
		function finished() {
			try {
				var erroredFiles = filesData.filter(function(data) { return data.err; });
				if(erroredFiles.length > 0) {
					var errorText = erroredFiles.map(function(data) {
						return data.name + ": " + data.err;
					}).join("\n");
					throw new Error(errorText);
				}
				var sourceMapFile, generatedFile;
				var javascriptWithSourceMap = filesData.filter(function(data) {
					return (/\.js$/.test(data.name) && SOURCE_MAPPING_URL_REG_EXP.test(data.result)) || 
							(/\.(css|js)$/.test(data.name) && SOURCE_MAPPING_URL_REG_EXP2.test(data.result));
				})[0];
				if(javascriptWithSourceMap) {
					if(typeof atob !== "function")
						throw new Error("Your browser doesn't support atob. Cannot decode base64.");
					// Extract SourceMap from base64 DataUrl
					generatedFile = javascriptWithSourceMap;
					filesData.splice(filesData.indexOf(generatedFile), 1);
					var generatedSource = generatedFile.result;
					var match = SOURCE_MAPPING_URL_REG_EXP.exec(generatedSource) || SOURCE_MAPPING_URL_REG_EXP2.exec(generatedSource);
					sourceMapFile = {
						result: atob(match[1])
					};
					sourceMapFile.json = JSON.parse(sourceMapFile.result);
				} else {
					// Find SourceMap in provided files
					var mapFiles = filesData.filter(function(data) {
						return /\.map$/.test(data.name);
					});
					if(mapFiles.length === 1) {
						// Use the .map file as SourceMap
						sourceMapFile = mapFiles[0];
						filesData.splice(filesData.indexOf(sourceMapFile), 1);
					} else {
						var jsonFiles = filesData.filter(function(data) {
							return /\.json$/.test(data.name);
						});
						if(jsonFiles.length === 1) {
							// Use the .json file as SourceMap
							sourceMapFile = jsonFiles[0];
							filesData.splice(filesData.indexOf(sourceMapFile), 1);
						} else {
							throw new Error("No SourceMap provided.");
						}
					}
					sourceMapFile.json = JSON.parse(sourceMapFile.result);

					// get name from SourceMap
					var name = sourceMapFile.json.file;
					generatedFile = filesData.filter(function(data) {
						// The file with the exact name
						return data.name === name;
					})[0] || filesData.filter(function(data) {
						// The first js file
						return /\.js$/.test(data.name);
					})[0];
					if(!generatedFile) {
						throw Error("No original file provided.");
					}
					filesData.splice(filesData.indexOf(generatedFile), 1);
				}
				var providedSourcesContent = filesData.map(function(data) { return data.result; });
				var sourcesContentSet = sourceMapFile.json.sourcesContent && sourceMapFile.json.sourcesContent.length > 0
				if(providedSourcesContent.length > 0 && sourcesContentSet)
					throw new Error("Provided source files and sourcesContent in SourceMap is set.");
				loadCustomExample(
					sourcesContentSet ? sourceMapFile.json.sourcesContent : providedSourcesContent,
					generatedFile.result,
					sourceMapFile.json
				);
				$(".custom-modal").modal("hide");
				oldHash = window.location.hash = "custom";
			} catch(err) {
				return $(".custom-error").removeClass("hide").text(err.message).attr("title", err.stack);
			}
		}
		return false;
	});

	function loadCustomExample(sourcesContent, generatedSource, sourceMap) {
		loadExample(sourcesContent, generatedSource, sourceMap);
		$(".custom-link").attr("href", "#base64," + [generatedSource, JSON.stringify(sourceMap)].concat(sourcesContent).map(function(str){
    	return btoa(unescape(encodeURIComponent( str )));
		}).join(",")).text("Link to this");
	}
	function loadExample(sources, exampleJs, exampleMap) {
		var generated = $(".generated").hide().text("");
		var original = $(".original").hide().text("");
		var mappings = $(".mappings").hide().text("1: ");

		try {
			exampleMap.file = exampleMap.file || "example.js";
			var map = new SourceMap.SourceMapConsumer(exampleMap);
			var mapSources = map.sources;

			var generatedLine = 1;
			var nodes = SourceMap.SourceNode.fromStringWithSourceMap(exampleJs, map).children;
			nodes.forEach(function(item, idx) {
				if(generatedLine > 1000) return;
				if(typeof item === "string") {
					generated.append($("<span>").text(item));
					generatedLine += item.split("\n").length - 1;
				} else {
					var str = item.toString();
					var source = mapSources.indexOf(item.source);
					generated.append($("<span>")
						.addClass("generated-item")
						.addClass("item-" + source + "-" + item.line + "-" + item.column)
						.attr("title", item.name)
						.data("source", source)
						.data("line", item.line)
						.data("column", item.column)
						.addClass("style-" + (item.line%LINESTYLES))
						.text(str));
					generatedLine += str.split("\n").length - 1;
				}
			});


			var lastGenLine = 1;
			var lastOrgSource = "";
			map.eachMapping(function(mapping) {
				if(mapping.generatedLine > 1000) return;
				while(lastGenLine < mapping.generatedLine) {
					mappings.append($("<br>"));
					lastGenLine++;
					mappings.append($("<span>").text(lastGenLine + ": "));
				}
				if(typeof mapping.originalLine == "number") {
					if(lastOrgSource !== mapping.source && mapSources.length > 1) {
						mappings.append($("<span>").text("[" + mapping.source + "] "));
						lastOrgSource = mapping.source;
					}
					var source = mapSources.indexOf(mapping.source);
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


			var line = 1, column = 0, currentOutputLine = 1, targetOutputLine = -1, limited = false;
			var lastMapping = null;
			var currentSource = null;
			var exampleLines;
			var mappingsBySource = {};
			map.eachMapping(function(mapping) {
				if(typeof mapping.originalLine !== "number") return;
				if(mapping.generatedLine > 1000) return limited = true;
				if(!mappingsBySource[mapping.source]) mappingsBySource[mapping.source] = [];
				mappingsBySource[mapping.source].push(mapping);
			}, undefined, SourceMap.SourceMapConsumer.ORIGINAL_ORDER);
			Object.keys(mappingsBySource).map(function(source) {
				return [source, mappingsBySource[source][0].generatedLine];
			}).sort(function(a, b) {
				return a[1] - b[1];
			}).forEach(function(arr) {
				var source = arr[0];
				var mappings = mappingsBySource[source];

				if(currentSource) endFile();
				lastMapping = null;
				line = 1;
				column = 0;
				targetOutputLine = -1;
				if(mapSources.length > 1)
					currentOutputLine += 2;
				var startLine = mappings.map(function(mapping) {
					return mapping.generatedLine - mapping.originalLine + 1;
				}).sort(function(a, b) { return a - b });
				startLine = startLine[0];
				while(currentOutputLine < startLine) {
					original.append($("<span>").text("\n"));
					currentOutputLine++;
				}
				if(mapSources.length > 1)
					original.append($("<h4>")
						.text(source));
				var exampleSource = sources[mapSources.indexOf(source)];
				if(!exampleSource) throw new Error("Source '" + source + "' missing");
				exampleLines = exampleSource.split("\n");
				currentSource = source;
				mappings.forEach(function(mapping, idx) {
					if(lastMapping) {
						var source = mapSources.indexOf(lastMapping.source);
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
							currentOutputLine++;
							while(line < mapping.originalLine) {
								original.append($("<span>").text(exampleLines.shift() + "\n"));
								line++; column = 0;
								currentOutputLine++;
							}
							startLine = [];
							for(var i = idx; i < mappings.length && mappings[i].originalLine <= mapping.originalLine + 1; i++) {
								startLine.push(mappings[i].generatedLine - mappings[i].originalLine + mapping.originalLine);
							}
							startLine.sort(function(a, b) { return a - b });
							startLine = startLine[0];
							while(startLine && currentOutputLine < startLine) {
								original.append($("<span>").text("~\n"));
								currentOutputLine++;
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
				});
			});
			function endFile() {
				if(lastMapping) {
					var source = mapSources.indexOf(lastMapping.source);
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
			if(!limited) {
				exampleLines.forEach(function(line) {
					original.append($("<span>").text("\n" + line));
				});
			}

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
		} catch(e) {
			throw e;
		} finally {
			generated.show();
			original.show(),
			mappings.show();
		}
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