var path = require("path");

var Component = require("../component");
var array_utils = require("../../utils/array");
var verify = require("../../utils/verify");


/**
 * @class CppComponent
 * C++ component definiton.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var CppComponent = module.exports = function CppComponent(configuration) {
  this._verify(configuration);
  this._exclude = configuration.exclude;

  Component.call(this, configuration);

  this._path  = configuration.path;
  this._types = {
    lib: this._compileLib
  };
};
CppComponent.prototype = Object.create(Component.prototype);

/**
 * Configures and enqueues tasks based on the target type.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 * @param {!Components} components Collection of components in the system.
 */
CppComponent.prototype._compileByType = function _compileByType(
    key, name, target, components
) {
  var type = this._targets[target].type;
  if (!type) {
    // No type set, skip this step.
    return;
  }

  if (!(type in this._types)) {
    throw new Error("Unrecognised target type '" + type + "'");
  }

  var handler = this._types[type];
  handler.call(this, key, name, target, components);
};

/**
 * Configures and enqueues the tasks to compile the core of the component.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 * @param {!Components} components Collection of components in the system.
 */
CppComponent.prototype._compileCore = function _compileCore(
    key, name, target, components
) {
  var include = this._includes(components, target);
  var sources = this._sources(target);

  this._grunt.config("g++." + key + "\\.core", {
    coverage: target === "test",
    include:  include,
    objects_path: path.join("out", "build", target),
    src: sources
  });
  this._grunt.task.run("g++:" + name + ".core");
};

/**
 * Configures and enqueues tasks for static libraries.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 * @param {!Components} components Collection of components in the system.
 */
CppComponent.prototype._compileLib = function _compileLib(
    key, name, target, components
) {
  this._grunt.config("ar." + key + "\\.lib", {
    files: [{
      dest: path.join("out", "dist", target, this._path, this._name + ".a"),
      src:  path.join("out", "build", target, this._path, "**", "*.o")
    }]
  });
  this._grunt.task.run("ar:" + name + ".lib");
};

/**
 * List include paths for the current component based on its dependencies.
 * @param {!Components} components Collection of components in the system.
 * @param {!String}     target     The target mode to compile for.
 * @returns {!Array.<!String>} the list of include paths.
 */
CppComponent.prototype._includes = function _includes(components, target) {
  var include = [];
  var deps    = components.resolve(this._name, target);

  deps.forEach(function(dep) {
    if (dep instanceof CppComponent) {
      include.push(path.join(dep._path, "include"));
    }
  });

  return include;
};

//@override
CppComponent.prototype._process_targets = function _process_targets(config) {
  Component.prototype._process_targets.call(this, config);

  var _this   = this;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target_name) {
    _this._verifyTarget(config.targets[target_name]);

    var target  = config.targets[target_name];
    var exclude = [];

    if (config.exclude) {
      exclude.push.apply(exclude, config.exclude);
    }
    if (target.exclude) {
      exclude.push.apply(exclude, target.exclude);
    }

    _this._targets[target_name].exclude = array_utils.filterDuplicates(exclude);
    _this._targets[target_name].type    = target.type;
  });
};

/**
 * Lists glob patterns for source files of the core task.
 * @param {!String}     target     The target mode to compile for.
 * @returns {!Array.<!String>} the list of source files.
 */
CppComponent.prototype._sources = function _sources(target) {
  var sources = [path.join(this._path, "src", "**", "*.cpp")];

  if (this._targets[target].exclude) {
    this._targets[target].exclude.forEach(function(exclude) {
      sources.push("!" + exclude);
    });
  }

  return sources;
};

/**
 * Verifies the configuration.
 * @param {!Object} configuration The configuration to verify.
 */
CppComponent.prototype._verify = function _verify(configuration) {
  var exclude_message = (
      "The exclude attribute must be array of strings, if specified"
  );

  verify.notEmptyString(configuration.path, "Missing component path");
  verify.optionalArray(configuration.exclude, exclude_message);

  (configuration.exclude || []).forEach(function(exclude) {
    verify.notEmptyString(exclude, exclude_message);
  });
};

/**
 * Verifies a target configuration.
 * @param {!Object} target The target configuration to verify.
 */
CppComponent.prototype._verifyTarget = function _verifyTarget(target) {
  var exclude_message = (
      "The exclude attribute must be array of strings, if specified"
  );

  verify.optionalArray(target.exclude, exclude_message);
  (target.exclude || []).forEach(function(exclude) {
    verify.notEmptyString(exclude, exclude_message);
  });

  if (typeof target.type !== "undefined") {
    verify.notEmptyString(target.type, "Type must be a valid string");
  }
};

//@override
CppComponent.prototype.getCleanPath = function getCleanPath(target) {
  return [
    path.join("out", "build", target, this._path),
    path.join("out", "dist",  target, this._path)
  ];
};

//Override
CppComponent.prototype.handleTarget = function handleTarget(
    target, components
) {
  var key  = target + "\\." + this._name;
  var name = target + "." + this._name;

  this._compileCore(key, name, target, components);
  this._compileByType(key, name, target, components);
};


// Debug, Release, Test, Analysis
