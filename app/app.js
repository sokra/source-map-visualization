require("imports?this=>window!jquery-hashchange");
var SourceMap = require("source-map");
var UglifyJS = require("./uglify-js");
var generateHtml = require("./generateHtml");

var exampleKinds = ["coffee", "simple-coffee", "typescript", "babel"];
var SOURCE_MAPPING_URL_REG_EXP = /\/\/[@#]\s*sourceMappingURL\s*=\s*data:[^\n]*?base64,([^\n]*)/;
var SOURCE_MAPPING_URL_REG_EXP2 = /\/\*\s*[@#]\s*sourceMappingURL\s*=\s*data:[^\n]*?base64,([^\n]*)\s*\*\//;

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
			var input = exampleKind.split(",").slice(1).map(function(str) {
				return decodeURIComponent(escape(atob(str)));
			});
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
					generatedSource = generatedSource.replace(SOURCE_MAPPING_URL_REG_EXP, "/* base64 source map removed */").replace(SOURCE_MAPPING_URL_REG_EXP2, "/* base64 source map removed */");
					try {
						sourceMap = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
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
					generatedFile.result = generatedFile.result.replace(SOURCE_MAPPING_URL_REG_EXP, "/* base64 source map removed */").replace(SOURCE_MAPPING_URL_REG_EXP2, "/* base64 source map removed */");
					sourceMapFile = {
						result: decodeURIComponent(escape(atob(match[1])))
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
		var visu = $("main").hide().text("");
		var footer = $("footer")

		try {
			exampleMap.file = exampleMap.file || "example.js";
			var map = new SourceMap.SourceMapConsumer(exampleMap);

			var results = generateHtml(map, exampleJs, sources); 
			visu.html(results.files);
			footer.prepend(results.mappings);
			
			$("body").delegate(".original-item, .generated-item, .mapping-item", "mouseenter", function() {
				$(".selected").removeClass("selected");
				var mappedItems = $(this).data('mapped');
				if (!mappedItems){
					var source = $(this).data("source");
					var line = $(this).data("line");
					var column = $(this).data("column");
					mappedItems = $(".item-" + source + "-" + line + "-" + column);
					$(this).data('mapped', mappedItems)
				}
				$(mappedItems).addClass("selected");
			}).delegate(".original-item, .generated-item, .mapping-item", "click", function() {
				var mappedItems = $(this).data('mapped');
				var elems = $(mappedItems).not(this).get();
				if (elems.length) {
					elems.forEach(function (elem) {
						if ('scrollIntoViewIfNeeded' in elem)
							return elem.scrollIntoViewIfNeeded();
						elem.scrollIntoView({behavior: 'smooth'})
					})
				}	
			});

			$('header p .btn-primary').off('click').click(function() {
				var result = UglifyJS.minify(exampleJs, {
					outSourceMap: "example.map",
					output: {
						beautify: true
					}
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

				loadExample(minmap.sourcesContent, result.code, minmap);
				oldHash = window.location.hash = "custom";
			});
		} catch(e) {
			throw e;
		} finally {
			visu.show();
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
