var path = require("path");
var GruntModule = require("./grunt-module");


var GrHunter = module.exports = function GrHunter(grunt) {
  this._grunt   = grunt;
  this._modules = {};
  this._modules_order = [];
  this._package_info  = null;
};


GrHunter.prototype._composeAliases = function _composeAliases() {
  var multi_aliases  = {};
  var simple_aliases = {};

  // Register aliases.
  this._forEachInObject("_alias", function(alias_name, items) {
    if (alias_name in simple_aliases) {
      throw new Error("Alias " + alias_name + " already defined");
    }
    simple_aliases[alias_name] = true;
    this._grunt.registerTask(alias_name, items);
  });

  // Compose extended aliases.
  this._forEachInObject("_alias_more", function(alias_name, items) {
    if (alias_name in simple_aliases) {
      throw new Error("Alias " + alias_name + " already defined");
    }
    if (!multi_aliases.hasOwnProperty(alias_name)) {
      multi_aliases[alias_name] = [];
    }
    Array.prototype.push.apply(multi_aliases[alias_name], items);
  });

  // Register extended tasks.
  for (var alias in multi_aliases) {
    if (!multi_aliases.hasOwnProperty(alias)) { continue; }
    this._grunt.registerTask(alias, multi_aliases[alias]);
  }
};

GrHunter.prototype._composeConfiguration = function _composeConfiguration() {
  // Build the final configuration.
  var configuration = {
    pkg: this._package_info
  };
  var simple_tasks = {};

  // Compose tasks.
  this._forEachInObject("_tasks", function(task_name, task_config) {
    if (task_name in simple_tasks) {
      throw new Error("Simple task " + task_name + " already defined");
    }
    simple_tasks[task_name]  = true;
    configuration[task_name] = task_config;
  });

  // Compose multi tasks.
  this._forEachInObject("_multi_tasks", function(task_name, subtasks) {
    if (task_name in simple_tasks) {
      throw new Error("Task " + task_name + " already defined as simple task");
    }

    // First time the task group is defined.
    if (!configuration.hasOwnProperty(task_name)) {
      configuration[task_name] = {};
    }

    // Process each subtask.
    for (var subtask in subtasks) {
      if (!subtasks.hasOwnProperty(subtask)) { continue; }
      if (subtask in configuration[task_name]) {
        throw new Error(
            "Multi task " + task_name + ":" + subtask + " is already defined"
        );
      }
      configuration[task_name][subtask] = subtasks[subtask];
    }
  });

  // Finally register it.
  this._grunt.initConfig(configuration);
};

GrHunter.prototype._forEachInObject = function _forEachInObject(
    attr, callback
) {
  // For each module ...
  for (var mod = 0; mod < this._modules_order.length; mod++) {
    var mod_name = this._modules_order[mod];
    var object   = this._modules[mod_name][attr];

    // ... and each key it defines.
    for (var key in object) {
      if (!object.hasOwnProperty(key)) { continue; }
      callback.call(this, key, object[key]);
    }
  }
};

/**
 * @returns {!GruntModule} The intenral GrHunter module used to proxy global
 *                         configurations.
 */
GrHunter.prototype._getInternalModule = function _getInternalModule() {
  if (!("__internal__" in this._modules)) {
    this.addModule("__internal__");
  }
  return this._modules["__internal__"];
};

GrHunter.prototype._loadTasks = function _loadTasks() {
  var loaded_modules = {};
  this._forEachInObject("_load", function(task) {
    if (task in loaded_modules) { return; }
    loaded_modules[task] = true;
    this._grunt.loadTasks(task);
  });
};

GrHunter.prototype._loadNpmTasks = function _loadNpmTasks() {
  var loaded_modules = {};
  this._forEachInObject("_load_npm", function(task) {
    if (task in loaded_modules) { return; }
    loaded_modules[task] = true;
    this._grunt.loadNpmTasks(task);
  });
};


GrHunter.prototype.addModule = function addModule(module_name) {
  if (module_name in this._modules) {
    throw new Error("Cannot define module " + module_name + " more than once.");
  }
  this._modules[module_name] = new GruntModule(this._grunt);
  this._modules_order.push(module_name);
  return this._modules[module_name];
};

GrHunter.prototype.compose = function compose() {
  // Compose tasks.
  this._loadNpmTasks();
  this._loadTasks();

  // Compose configurations and aliases.
  this._composeConfiguration();
  this._composeAliases();
};

GrHunter.prototype.loadModule = function loadModule(
    module_location/*, varargs */
) {
  module_location  = path.resolve(path.normalize(module_location));
  var node_module  = require(module_location);
  var grunt_module = this.addModule(module_location);

  var args = [grunt_module];
  args.push.apply(args, Array.prototype.slice.call(arguments, 1));
  args.push(this);
  node_module.apply(node_module, args);
};

/**
 * Add tasks to be loaded when the configuration is composed.
 * @param {!String} task The name of the local module to load.
 */
GrHunter.prototype.loadTasks = function loadTasks(task) {
  this._getInternalModule().loadTasks(task);
};

/**
 * Add NPM tasks to be loaded when the configuration is composed.
 * @param {!String} task The name of the NPM module to load.
 */
GrHunter.prototype.loadNpmTasks = function loadNpmTasks(task) {
  this._getInternalModule().loadNpmTasks(task);
};

GrHunter.prototype.package = function package(pkg) {
  this._package_info = pkg;
};
