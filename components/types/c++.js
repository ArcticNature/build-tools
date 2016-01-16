var path = require("path");

var Component = require("../component");
var ProtoBufComponent = require("./protobuf");
var ScriptsComponent  = require("./scripts");

var array_utils = require("../../utils/array");
var verify = require("../../utils/verify");

var GCOVR_PATH = path.resolve("build-tools/gcovr");


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
  this._whole_archive = configuration["load-all-archives"] || false;
  this._types = {
    bin: this._compileBin,
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
    debug:    target !== "release",
    include:  include,
    objects_path: path.join("out", "build", target),
    src: sources
  });
  this._grunt.task.run("g++:" + name + ".core");
};

/**
 * Configures and enqueues tasks for binaries.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target to compile.
 * @param {Boolean} link_gtest True if linking tests.
 * @param {!Components} components Collection of components in the system.
 */
CppComponent.prototype._compileBin = function _compileBin(
    key, name, target, components
) {
  var bin_name  = this._name;
  var libraries = this._dynamicLibraries(components, target);
  var objects   = [path.join("out", "build", target, this._path, "**", "*.o")];
  var task_ext  = "bin";

  var link_gtest = target === "test";
  if (link_gtest) {
    bin_name = "run-tests";
    libraries.push("pthread", "gcov");
    task_ext = "gtest";

    // Exclude main.o from tests to avoid link error.
    objects.push(
        "!" + path.join("out", "build", target, this._path, "**", "main.o"),
        path.join("out", "build", "gtest", "**", "*.o")
    );
  }

  objects.push.apply(objects, this._staticLibraries(components, target));

  this._grunt.config("link++." + key + "\\." + task_ext, {
    libs: libraries,
    whole_archive: this._whole_archive,
    files: [{
      dest: path.join("out", "dist", target, this._path, bin_name),
      src:  objects
    }]
  });
  this._grunt.task.run("link++:" + name + "." + task_ext);
};

CppComponent.prototype._compileGTest = function _compileGTest(key, name) {
  this._grunt.config("g++." + key + "\\.gtest", {
    coverage: true,
    debug:    true,
    include:  ["3rd-parties/include", "3rd-parties/sources/gtest"],
    objects_path: path.join("out", "build", "gtest"),
    src: [
      "3rd-parties/sources/gtest/src/gtest-all.cc",
      "3rd-parties/sources/gtest/src/gtest_main.cc"
    ]
  });
  this._grunt.task.run("g++:" + name + ".gtest");
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
 * Lists the dynamic libraries needed for this component.
 * @param {!Components} components Collection of components in the system.
 * @param {!String}     target     The target mode to compile for.
 * @returns {!Array.<!String>} the list of dynamic libraries.
 */
CppComponent.prototype._dynamicLibraries = function _dynamicLibraries(
    components, target
) {
  var libs = [];
  var deps = components.resolve(this._name, target);

  deps.forEach(function(dep) {
    libs.push.apply(libs, dep.instance.getDynamicLibs(dep.target));
  });

  libs.push.apply(libs, this._targets[target].libs || []);
  return libs;
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
    include.push.apply(include, dep.instance.getCppHeaders(dep.target));
  });

  if (this._targets[target].include) {
    include.push.apply(include, this._targets[target].include);
  }

  // Use bundled-in gtest in case the system has another version.
  if (target === "test") {
    include.push("3rd-parties/include");
  }
  return include;
};

//@override
CppComponent.prototype._process_targets = function _process_targets(config) {
  Component.prototype._process_targets.call(this, config);

  var _this   = this;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target_name) {
    _this._verifyTarget(config.targets[target_name]);
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
    _this._targets[target_name].type = target.type;
  });
};

/**
 * Lists glob patterns for source files of the core task.
 * @param {!String} target The target mode to compile for.
 * @returns {!Array.<!String>} the list of source files.
 */
CppComponent.prototype._sources = function _sources(target) {
  var sources = [path.join(this._path, "src", "**", "*.cpp")];
  if (target === "test") {
    sources.push(path.join(this._path, "tests", "**", "*.cpp"));
  }

  if (this._targets[target].exclude) {
    this._targets[target].exclude.forEach(function(exclude) {
      sources.push("!" + exclude);
    });
  }

  return sources;
};

/**
 * Lists the static libraries needed for this component.
 * @param {!Components} components Collection of components in the system.
 * @param {!String}     target     The target mode to compile for.
 * @returns {!Array.<!String>} the list of static library paths.
 */
CppComponent.prototype._staticLibraries = function _staticLibraries(
    components, target
) {
  var libs = [];
  var deps = components.resolve(this._name, target);

  deps.forEach(function(dep) {
    libs.push.apply(libs, dep.instance.getStaticLibs(dep.target));
  });

  libs.reverse();
  return libs;
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
  var include_message = (
      "The include attribute must be array of strings, if specified"
  );
  var libs_message = (
      "The libs attribute must be array of strings, if specified"
  );

  verify.optionalArray(target.exclude, exclude_message);
  verify.optionalArray(target.include, include_message);
  verify.optionalArray(target.libs,    libs_message);

  (target.exclude || []).forEach(function(exclude) {
    verify.notEmptyString(exclude, exclude_message);
  });
  (target.include || []).forEach(function(include) {
    verify.notEmptyString(include, include_message);
  });
  (target.libs || []).forEach(function(lib) {
    verify.notEmptyString(lib, libs_message);
  });

  if (typeof target.type !== "undefined") {
    verify.notEmptyString(target.type, "Type must be a valid string");
  }
};

//@override
CppComponent.prototype.getCleanPath = function getCleanPath(target) {
  var paths = [
    path.join("out", "build", target, this._path),
    path.join("out", "dist",  target, this._path)
  ];
  
  if (target === "analysis") {
    paths.push(path.join("out", "reports", this._path));
  }

  return paths;
};

//@override
CppComponent.prototype.getCppHeaders = function getCppHeaders(target) {
  return [path.join(this._path, "include")];
};

//@override
CppComponent.prototype.getDynamicLibs = function getDynamicLibs(target) {
  if (this._targets[target].type === "lib") {
    return this._targets[target].libs || [];
  }
  return [];
};

//@override
CppComponent.prototype.getOutput = function getOutput(target) {
  var type   = this._targets[target].type;
  var output = path.join("out", "dist", target, this._path, this._name);

  if (type === "lib") {
    return output + ".a";
  }

  return output;
};

/** @returns {!String} the path to the component directory. */
CppComponent.prototype.getPath = function getPath() {
  return this._path;
};

//@override
CppComponent.prototype.getStaticLibs = function getStaticLibs(target) {
  if (this._targets[target].type === "lib") {
    return [path.join("out", "dist", target, this._path, this.name() + ".a")];
  }
  return [];
};

//Override
CppComponent.prototype.handleAnalysis = function handleAnalysis(components) {
  var key  = "analysis\\." + Component.escapeName(this._name);
  var name = "analysis." + this._name;

  // Run linter.
  this._grunt.config("cpplint." + key, {
    options: {
      root: path.normalize(path.join(this._path, "include")),
      filter: [
        "-runtime/indentation_namespace",
        "-whitesp-lineace/parens-line"
      ]
    },
    src: [
      path.join(this._path, "include", "**", "*.h"),
      path.join(this._path, "src", "**", "*.cpp")
    ]
  });
  this._grunt.task.run("cpplint:" + name);

  // Stop here if test target does not exist.
  if (!this.hasTarget("test")) {
    return;
  }

  // Run static analysis.
  var include = this._includes(components, "test");
  this._grunt.config("cppcheck." + key, {
    exclude: ["3rd-parties", path.join(this._path, "tests")],
    include: include,
    save_to: path.join("out", "reports", this._path, "cppcheck.xml"),
    src: [
      path.join(this._path, "include", "**", "*.h"),
      path.join(this._path, "src", "**", "*.cpp")
    ]
  });
  this._grunt.task.run("cppcheck:" + name);

  // Run tests.
  this._grunt.config("shell." + key, {
    command: (
      path.join("out", "dist", "test", this._path, "run-tests") +
      " --gtest_output='xml:" +
      path.join("out", "reports", this._path, "test-results.xml") + "'"
    )
  });
  this._grunt.task.run("shell:" + name);

  // Run coverage.
  this._grunt.config("gcovr." + key, {
    exclude: ".*(3rd-parties|tests).*",
    gcovr:   GCOVR_PATH,
    objects: path.join("out", "build", "test", this._path, "src"),
    save_to: path.join("out", "reports", this._path, "coverage.xml")
  });
  this._grunt.task.run("gcovr:" + name);
};

//Override
CppComponent.prototype.handleTarget = function handleTarget(
    target, components
) {
  var key  = target + "\\." + Component.escapeName(this._name);
  var name = target + "." + this._name;

  this._compileCore(key, name, target, components);
  this._compileByType(key, name, target, components);

  if (target === "test") {
    this._compileGTest(key, name);
    this._compileBin(key, name, target, components);
  }
};
