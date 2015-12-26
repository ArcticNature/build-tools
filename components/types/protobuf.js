var path = require("path");

var Component   = require("../component");
var array_utils = require("../../utils/array");


/**
 * @class ProtoBuf
 * Protocol buffer component definiton.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var ProtoBuf = module.exports = function ProtoBuf(configuration) {
  Component.call(this, configuration);
  this._path = configuration.path;

  // ProtoBuf target.
  var gen = configuration.generate || {};
  this._generate_cpp = "c++" in gen ? gen["c++"] : true;
  this._generate_js  = gen.js || false;
};
ProtoBuf.prototype = Object.create(Component.prototype);


/**
 * Configures and enqueues tasks for compiling the generated C++ files.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 */
ProtoBuf.prototype._compileCC = function _compileCC(key, name, target) {
  this._grunt.config("g++." + key, {
    coverage: false,
    debug:    target === "test",
    objects_path: ".",
    src: [path.join("out", "build", target, this._path, "**", "*.cc")]
  });
  this._grunt.task.run("g++:" + name);
};

/**
 * Configures and enqueues tasks for compiling the JavaScript CommonJS module.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 */
ProtoBuf.prototype._compileJS = function _compileJS(key, name, target) {
  var target_name = this.name() + ".js";
  var source = path.join(this._path, "src", "**", "*.proto");
  var output = path.join("out", "dist", target, this._path, target_name);

  this._grunt.config("protobuf-js." + key, {
    minify: target === "release",
    output: output,
    src: source
  });

  this._grunt.task.run("protobuf-js:" + name);
};

/**
 * Configures and enqueues tasks for generating a static library.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 */
ProtoBuf.prototype._compileLib = function _compileLib(key, name, target) {
  this._grunt.config("ar." + key, {
    files: [{
      dest: path.join("out", "dist", target, this._path, this._name + ".a"),
      src:  path.join("out", "build", target, this._path, "**", "*.o")
    }]
  });
  this._grunt.task.run("ar:" + name);
};

/**
 * Configures and enqueues tasks for compiling the proto files.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 */
ProtoBuf.prototype._compileProto = function _compileProto(key, name, target) {
  var sources = [path.join("**", "*.proto")];
  if (this._targets[target].exclude) {
    this._targets[target].exclude.forEach(function(exclude) {
      sources.push("!" + exclude);
    });
  }

  this._grunt.config("protobuf-cpp." + key, {
    input_path:  path.join(this._path, "src"),
    headers_out: path.join("out", "dist", target, "headers", this._path),
    objects_out: path.join("out", "build", target, this._path),
    src: sources
  });
  this._grunt.task.run("protobuf-cpp:" + name);
};

//@override
ProtoBuf.prototype._process_targets = function _process_targets(config) {
  Component.prototype._process_targets.call(this, config);

  var _this   = this;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target_name) {
    var target = config.targets[target_name];

    // Extends a list with items from the global and the target configuration.
    var extend = function extend(name, list) {
      if (config[name]) {
        list.push.apply(list, config[name]);
      }
      if (target[name]) {
        list.push.apply(list, target[name]);
      }
      return list;
    };

    var exclude = extend("exclude", []);
    var include = extend("include", []);
    var libs    = extend("libs",    []);

    _this._targets[target_name].exclude = array_utils.filterDuplicates(exclude);
    _this._targets[target_name].include = array_utils.filterDuplicates(include);
    _this._targets[target_name].libs = array_utils.filterDuplicates(libs);
  });
};


//@override
ProtoBuf.prototype.getCleanPath = function getCleanPath(target) {
  var paths = [
    path.join("out", "build", target, this._path),
    path.join("out", "dist",  target, this._path),
    path.join("out", "dist",  target, "headers", this._path)
  ];
  return paths;
};

//@override
ProtoBuf.prototype.getCppHeaders = function getCppHeaders(target) {
  return [path.join("out", "dist", target, "headers")];
};

//@override
ProtoBuf.prototype.getDynamicLibs = function getDynamicLibs(target) {
  return this._targets[target].libs || [];
};

//@override
ProtoBuf.prototype.getNodeJsDependencies = function getNodeJsDependencies(
    target
) {
  if (!this._generate_js) {
    return [];
  }

  var target_name = this.name() + ".js";
  var output = path.join("out", "dist", target, this._path);
  return [{
    expand: true,
    cwd: output,
    src: target_name
  }];
};

//@override
ProtoBuf.prototype.getStaticLibs = function getStaticLibs(target) {
  return [path.join("out", "dist", target, this._path, this.name() + ".a")];
};

//Override
ProtoBuf.prototype.handleAnalysis = function handleAnalysis(components) {
  this._grunt.log.ok(
      "Skipping analysis of Protocol Buffer component '" + this._name + "'"
  );
};

//@override
ProtoBuf.prototype.handleTarget = function handleTarget(target, components) {
  var key  = target + "\\." + Component.escapeName(this._name);
  var name = target + "." + this._name;

  // C++ related configuration.
  if (this._generate_cpp) {
    this._compileProto(key, name, target);
    this._compileCC(key, name, target);
    this._compileLib(key, name, target);
  }

  // JS related configuration.
  if (this._generate_js) {
    this._compileJS(key, name, target);
  }
};
