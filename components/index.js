var fs   = require("fs");
var path = require("path");

var Components = require("./components");
var verify = require("../utils/verify");

var TYPES = {
  "c++":   require("./types/c++"),
  scripts: require("./types/scripts")
};

var index = module.exports = {};


index.loadFiles = function loadFiles(files, grunt) {
  var components = new Components();

  files.forEach(function(source) {
    var content = fs.readFileSync(source);
    var config  = JSON.parse(content);
    var type    = config.type;

    verify.notEmptyString(
        type, "Mandatory field 'type' for '" + source + "' must be string"
    );
    if (!(type in TYPES)) {
      throw new Error(
          "Unrecognised component type '" + type + "' for '" + source + "'"
      );
    }

    var constructor = TYPES[type];
    config.path = config.path || path.dirname(source);
    components.add(new constructor(config));
  });

  return components;
};
