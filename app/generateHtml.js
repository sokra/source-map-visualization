var SourceMap = require("source-map");
var LINESTYLES = 5;
var MAX_LINES = 5000;

module.exports = function(map, generatedCode, sources) {
	var generatedSide = [];
	var originalSide = [];
	var mappingsSide = [];

	function addTo(side, line, html) {
		side[line] = (side[line] || "") + html;
	}

	function span(text, options) {
		var attrs = {};
		if(options) {
			if(options.generated) {
				attrs["class"] = "generated-item";
			} else if(options.mapping) {
				attrs["class"] = "mapping-item";
			} else {
				attrs["class"] = "original-item";
			}
			if(typeof options.source !== "undefined") {
				attrs["class"] += " item-" + options.source + "-" + options.line + "-" + options.column;
			}
			attrs["class"] += " style-" + (options.line%LINESTYLES);
			attrs["title"] = options.name;
			attrs["data-source"] = options.source;
			attrs["data-line"] = options.line;
			attrs["data-column"] = options.column;
		}
		return "<span " + Object.keys(attrs).filter(function(key) {
			return typeof attrs[key] !== "undefined";
		}).map(function(key) {
			return key + "=\"" + attrs[key] + "\"";
		}).join(" ") + ">" + (text + "").replace(/</g, "&lt;") + "</span>";
	}

	var mapSources = map.sources;

	var generatedLine = 1;
	var nodes = SourceMap.SourceNode.fromStringWithSourceMap(generatedCode, map).children;
	nodes.forEach(function(item, idx) {
		if(generatedLine > MAX_LINES) return;
		if(typeof item === "string") {
			item.split("\n").forEach(function(line) {
				addTo(generatedSide, generatedLine, line);
				generatedLine++;
			});
			generatedLine--;
		} else {
			var str = item.toString();
			var source = mapSources.indexOf(item.source);
			str.split("\n").forEach(function(line) {
				addTo(generatedSide, generatedLine, span(line, {
					generated: true,
					source: source,
					line: item.line,
					column: item.column,
					name: item.name
				}));
				generatedLine++
			});
			generatedLine--;
		}
	});


	var lastGenLine = 1;
	var lastOrgSource = "";
	var mappingsLine = 1;
	map.eachMapping(function(mapping) {
		if(mapping.generatedLine > MAX_LINES) return;
		while(lastGenLine < mapping.generatedLine) {
			mappingsLine++;
			lastGenLine++;
			addTo(mappingsSide, mappingsLine, lastGenLine + ": ");
		}
		if(typeof mapping.originalLine == "number") {
			if(lastOrgSource !== mapping.source && mapSources.length > 1) {
				addTo(mappingsSide, mappingsLine, "[" + mapping.source + "] ");
				lastOrgSource = mapping.source;
			}
			var source = mapSources.indexOf(mapping.source);
			addTo(mappingsSide, mappingsLine, span(mapping.generatedColumn + "->" + mapping.originalLine + ":" + mapping.originalColumn, {
				mapping: true,
				source: source,
				line: mapping.originalLine,
				column: mapping.originalColumn
			}));
		} else {
			addTo(mappingsSide, mappingsLine, span(mapping.generatedColumn, {
				mapping: true
			}));
		}
		addTo(mappingsSide, mappingsLine, "  ");
	});


	var originalLine = 1;
	var line = 1, column = 0, currentOutputLine = 1, targetOutputLine = -1, limited = false;
	var lastMapping = null;
	var currentSource = null;
	var exampleLines;
	var mappingsBySource = {};
	map.eachMapping(function(mapping) {
		if(typeof mapping.originalLine !== "number") return;
		if(mapping.generatedLine > MAX_LINES) return limited = true;
		if(!mappingsBySource[mapping.source]) mappingsBySource[mapping.source] = [];
		mappingsBySource[mapping.source].push(mapping);
	}, undefined, SourceMap.SourceMapConsumer.ORIGINAL_ORDER);
	Object.keys(mappingsBySource).map(function(source) {
		return [source, mappingsBySource[source][0].generatedLine];
	}).sort(function(a, b) {
		if(a[0] === "?") return 1;
		if(b[0] === "?") return -1;
		return a[1] - b[1];
	}).forEach(function(arr) {
		console.log(arr);
		var source = arr[0];
		var mappings = mappingsBySource[source];

		if(currentSource) endFile();
		lastMapping = null;
		line = 1;
		column = 0;
		targetOutputLine = -1;
		if(mapSources.length > 1) {
			currentOutputLine++;
		}
		var startLine = mappings.map(function(mapping) {
			return mapping.generatedLine - mapping.originalLine + 1;
		}).sort(function(a, b) { return a - b });
		startLine = startLine[0];
		while(currentOutputLine < startLine) {
			originalLine++;
			currentOutputLine++;
		}
		if(mapSources.length > 1) {
			addTo(originalSide, originalLine, "<h4>" + source.replace(/</g, "&lt;") + "</h4>");
			originalLine++;
		}
		var exampleSource = sources[mapSources.indexOf(source)];
		if(!exampleSource) throw new Error("Source '" + source + "' missing");
		exampleLines = exampleSource.split("\n");
		currentSource = source;
		mappings.forEach(function(mapping, idx) {
			if(lastMapping) {
				var source = mapSources.indexOf(lastMapping.source);
				if(line < mapping.originalLine) {
					addTo(originalSide, originalLine, span(exampleLines.shift(), {
						original: true,
						source: source,
						line: lastMapping.originalLine,
						column: lastMapping.originalColumn
					}));
					originalLine++;
					line++; column = 0;
					currentOutputLine++;
					while(line < mapping.originalLine) {
						addTo(originalSide, originalLine, exampleLines.shift());
						originalLine++;
						line++; column = 0;
						currentOutputLine++;
					}
					startLine = [];
					for(var i = idx; i < mappings.length && mappings[i].originalLine <= mapping.originalLine + 1; i++) {
						startLine.push(mappings[i].generatedLine - mappings[i].originalLine + mapping.originalLine);
					}
					startLine.sort(function(a, b) { return a - b });
					startLine = startLine[0];
					while(typeof startLine !== "undefined" && currentOutputLine < startLine) {
						addTo(originalSide, originalLine, "~");
						originalLine++;
						currentOutputLine++;
					}
					if(column < mapping.originalColumn) {
						addTo(originalSide, originalLine, shiftColumns(mapping.originalColumn - column));
					}
				}
				if(mapping.originalColumn > column) {
					addTo(originalSide, originalLine, span(shiftColumns(mapping.originalColumn - column), {
						original: true,
						source: source,
						line: lastMapping.originalLine,
						column: lastMapping.originalColumn
					}));
				}
			} else {
				while(line < mapping.originalLine) {
					addTo(originalSide, originalLine, exampleLines.shift());
					originalLine++;
					line++; column = 0;
				}
				if(column < mapping.originalColumn) {
					addTo(originalSide, originalLine, shiftColumns(mapping.originalColumn - column));
				}
			}
			lastMapping = mapping;
		});
	});
	function endFile() {
		if(lastMapping) {
			var source = mapSources.indexOf(lastMapping.source);
			addTo(originalSide, originalLine, span(exampleLines.shift(), {
				original: true,
				source: source,
				line: lastMapping.originalLine,
				column: lastMapping.originalColumn
			}));
		}
		if(!limited) {
			exampleLines.forEach(function(line) {
				originalLine++;
				currentOutputLine++;
				addTo(originalSide, originalLine, line);
			});
		}
	}
	endFile();

	function shiftColumns(count) {
        var nextLine = exampleLines[0];
		exampleLines[0] = nextLine.substr(count);
		column += count;
		return nextLine.substr(0, count);
	}

	var length = Math.max(originalSide.length, generatedSide.length, mappingsSide.length);

	var tableRows = [];

	for (var i = 0; i < length; i++) {
		tableRows[i] = [
			originalSide[i] || "",
			generatedSide[i] || "",
			mappingsSide[i] || ""
		].map(function(cell) {
			return "<td>" + cell + "</td>";
		});
	}

    var originalSideElem = "<div class='origside codeblock'><h3>original</h3><pre><code><table><tbody>";
    var generatedSideElem = "<div class='genside codeblock'><h3>compiled</h3><pre><code><table><tbody>";
    var mappingsSideElem = "<div class='genside codeblock'><h3>mappings</h3><pre><code><table><tbody>";

    tableRows.forEach(function (row) {
        originalSideElem += "<tr>" + row[0] + "</tr>",
        generatedSideElem += "<tr>" + row[1] + "</tr>",
        mappingsSideElem += "<tr>" + row[2] + "</tr>"
    });

    return {
        files: generatedSideElem + "</tbody></table></code></pre></div>" +
               originalSideElem + "</tbody></table></code></pre></div>",
        mappings: mappingsSideElem + "</tbody></table></code></pre></div>"
    };
            
        
}