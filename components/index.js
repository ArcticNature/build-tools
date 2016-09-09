// Cache expire after 30 days (in milliseconds).
//var COMPONENTS_CACHE_EXPIRE = 30 * 24 * 60 * 60 * 1000;
// Cache never expires.
var COMPONENTS_CACHE_EXPIRE = -1;
var COMPONENTS_CACHE_PATH = ".components.cache.json";

var assert = require("assert");
var fs   = require("fs");
var path = require("path");

var Components = require("./components");
var verify = require("../utils/verify");

var TYPES = {
  "c++":  require("./types/c++"),
  nodejs: require("./types/nodejs"),
  protobuf:  require("./types/protobuf"),
  scripts:   require("./types/scripts"),
  templates: require("./types/templates")
};

var index = module.exports = {};
var components_singleton = null;


/**
 * Parses a line from the components configuration file.
 * This files lists enabled/disabled components.
 * 
 * @param {!String} line The line to parse.
 * @returns {!Object}
 *    An object with the following properites:
 *      * disabled: true if the component is disabled.
 *      * name: the name of the component to disable.
 */
var parse_component_config_line = function parse_component_config_line(line) {
  var split = line.split("=");  
  if (split.length !== 2 || split[1] === "") {
    throw new Error("Invalid line '" + line + "'");
  }

  var name  = split[0].trim();
  var state = split[1].trim();
  if (state !== "enabled" && state !== "disabled") {
    throw new Error("Unrecognised option '" + state + "'");
  }

  return {
    disabled: state === "disabled",
    name: name
  };
};


/**
 * Discover and configure components.
 * Once components are discovered they are also enabled/disabled based
 * on configuration files.
 * 
 * @param {!Object} grunt  Global grunt instance.
 * @param {!String} target The name of the target to load compoments for.
 * @returns {!Components} collection of components.
 */
index.getComponents = function getComponents(grunt, target) {
  assert(target);
  if (components_singleton !== null) {
    return components_singleton;
  }

  var components = null;
  var components_definitions = null;
  var count = 0;

  // Check for cached definition files.
  var cacheValid = false;
  if (grunt.file.exists(COMPONENTS_CACHE_PATH)) {
    var cacheStats = fs.statSync(COMPONENTS_CACHE_PATH);
    var now = Date.now();
    var delta = now - cacheStats.mtime.getTime();
    cacheValid = (
      delta < COMPONENTS_CACHE_EXPIRE ||
      COMPONENTS_CACHE_EXPIRE === -1
    );
  }

  if (cacheValid) {
    grunt.log.write("Using components cache ... ");
    components_definitions = grunt.file.readJSON(COMPONENTS_CACHE_PATH);
    grunt.log.ok();

  } else {
    grunt.log.write("Scanning working directory for components ... ");
    components_definitions = grunt.file.expand([
      "**/component.json",
      "!**/node_modules/**"
    ]);
    grunt.log.ok();
  }

  components_definitions.forEach(function(file) {
    grunt.log.verbose.writeln(file);
  });

  count = components_definitions.length;
  grunt.log.write("Loading " + count + " components ... ");
  components = index.loadFiles(components_definitions, grunt);
  grunt.log.ok();

  // Load enabled/disabled components.
  // Ignore unkown components in that list.
  grunt.log.write("Checking components configuration ... ");
  var conf_path = "build-tools/components-config/" + target;

  if (grunt.file.exists(conf_path)) {
    var config = grunt.file.read(conf_path);
    var lines  = config.split("\n");

    lines.forEach(function(line) {
      if (!line) { return; }
      var parsed = parse_component_config_line(line);
      if (parsed.disabled && components.has(parsed.name)) {
        grunt.log.verbose.ok("Disabling component: " + parsed.name);
        components.get(parsed.name).disable();
      }
    });

  } else {
    grunt.log.verbose.error("Missing components config file: " + conf_path);
  }
  grunt.log.ok();

  grunt.log.write("Injecting dependencies and verifing configuration ... ");
  components.inject();
  components.verify();
  grunt.log.ok();

  // Update/create cache file.
  grunt.log.write("Updating component cache ... ");
  grunt.file.write(
    COMPONENTS_CACHE_PATH, JSON.stringify(components_definitions)
  );
  grunt.log.ok();

  components_singleton = components;
  return components;
};

/** Resets the signleton instance, used for testing. */
index.getComponents._reset = function() {
  components_singleton = null;
};

/**
 * Loads a list of component configuration files.
 * @param {!Array.<String>} files The list of files to load.
 * @param {!Object} grunt The global grunt instance.
 * @returns {!Components} The components collection.
 */
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
    config.path  = config.path  || path.dirname(source);
    config.grunt = config.grunt || grunt;
    components.add(new constructor(config));
  });

  return components;
};
