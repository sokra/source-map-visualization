var SourceMap = require("source-map");
var UglifyJS = require("./uglify-js");

var exampleKinds = ["minimize", "beautify", "coffee", "simple-coffee", "simple-coffee-redux", "typescript"];
var LINESTYLES = 5;

$(function() {
	require("bootstrap");
	require("./app.less");
	$("body").html(require("./app.jade")({kinds: exampleKinds}));

	$(".example").click(function() {
		var exampleKind = $(this).data("example");
		var example = require("!raw!../example/"+exampleKind+"/example");
		var exampleJs = require("!raw!../example/"+exampleKind+"/example.js");
		var exampleMap = require("!json!../example/"+exampleKind+"/example.map");
		loadExample(example, exampleJs, exampleMap);
	});

	function loadExample(example, exampleJs, exampleMap) {
		exampleMap.file = exampleMap.file || "example.js";
		var map = new SourceMap.SourceMapConsumer(exampleMap);

		var generated = $(".generated").text("");
		var original = $(".original").text("");

		var nodes = SourceMap.SourceNode.fromStringWithSourceMap(exampleJs, map).children;
		nodes.forEach(function(item) {
			if(typeof item === "string") {
				generated.append($("<span>").text(item));
			} else {
				var str = item.toString();
				generated.append($("<span>")
					.addClass("generated-item")
					.addClass("generated-item-" + item.line + "-" + item.column)
					.attr("title", item.name)
					.data("line", item.line)
					.data("column", item.column)
					.addClass("style-" + (item.line%LINESTYLES))
					.text(str));
			}
		});
		var exampleLines = example.split("\n");
		var line = 1, column = 0;
		var lastMapping = null;
		map.eachMapping(function(mapping) {
			if(mapping.source !== "example") return;
			if(lastMapping) {
				if(line < mapping.originalLine) {
					original.append($("<span>")
						.addClass("original-item")
						.addClass("original-item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
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
						.addClass("original-item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
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
		original.append($("<span>")
			.addClass("original-item")
			.addClass("original-item-" + lastMapping.originalLine + "-" + lastMapping.originalColumn)
			.data("line", lastMapping.originalLine)
			.data("column", lastMapping.originalColumn)
			.addClass("style-" + (lastMapping.originalLine%LINESTYLES))
			.text(exampleLines.shift()));
		exampleLines.forEach(function(line) {
			original.append($("<span>").text("\n" + line));
		});

		function shiftColumns(count) {
			var nextLine = exampleLines[0];
			exampleLines[0] = nextLine.substr(count);
			column += count;
			return nextLine.substr(0, count);
		}

		generated.delegate(".generated-item", "mouseenter", function() {
			$(".selected").removeClass("selected");
			$(this).addClass("selected");
			var line = $(this).data("line");
			var column = $(this).data("column");
			$(".original-item-" + line + "-" + column).addClass("selected");
		});

		original.delegate(".original-item", "mouseenter", function() {
			$(".selected").removeClass("selected");
			$(this).addClass("selected");
			var line = $(this).data("line");
			var column = $(this).data("column");
			$(".generated-item-" + line + "-" + column).addClass("selected");
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
				minmap = minmap.toJSON();
				
				loadExample(example, result.code, minmap);
			}));
	}
});