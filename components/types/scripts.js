var path = require("path");

var Component = require("../component");
var verify = require("../../utils/verify");


/**
 * @class ScriptsComponent
 * Component based on the execution of custom scrips and/or tasks.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var ScriptsComponent = module.exports = function ScriptsComponent(
    configuration
) {
  // These options required for target processing so before calling super.
  this._scripts = configuration.scripts || {};
  this._tasks   = configuration.tasks   || {};

  Component.call(this, configuration);
  this._validate(configuration);

  // Store configuration.
  this._analysis = configuration.analysis;
  this._clear_path = configuration["clear-path"];
  this._path = configuration.path;

  this._include_path = configuration["include-path"];
  this._dynamic_libs = configuration["dynamic-libs"] || [];
  this._static_libs  = configuration["static-libs"]  || [];
};
ScriptsComponent.prototype = Object.create(Component.prototype);

/**
 * Expands strings as templates, returns values and recurse into objects
 * and arrays.
 * @param {!String} target The target to expand with.
 * @param {*}       value  The value to expand.
 * @returns {*} The processed value.
 */
ScriptsComponent.prototype._expandValue = function _expandValue(target, value) {
  var _this = this;

  if (Array.isArray(value)) {
    return value.map(function(nested_value) {
      return _this._expandValue(target, nested_value);
    });

  } else if (typeof value === "string") {
    return this._template(value, target);

  } else if (typeof value === "object" && value !== null) {
    var processed = {};
    Object.keys(value).forEach(function(key) {
      processed[key] = _this._expandValue(target, value[key]);
    });
    return processed;

  }
  return value;
};

/**
 * Handles the execution of a script target.
 * @param {!String} script The name of the script to handle.
 * @param {!string} target The target being handled.
 */
ScriptsComponent.prototype._handleScript = function _handleScript(
    script, target
) {
  var command = null;
  var config  = this._scripts[script];

  if (typeof config === "string") {
    command = this._template(config, target);

  } else if (typeof config === "object" && config !== null) {
    var _this = this;
    var args  = config.arguments || [];
    args = args.map(function(arg) {
      return _this._template(arg, target);
    });
    command = this._template(config.command, target) + " " + args.join(" ");

  } else {
    throw new Error(
      "Invalid script '" + script + "' configuration for '" +
      this._name + "'"
    );
  }

  var key = Component.escapeName(this._name);
  this._grunt.config("shell." + target + "\\." + key + "\\." + script, {
    command: command
  });
  this._grunt.task.run("shell:" + target + "." + this._name + "." + script);
};

/**
 * Handles the execution of a task target.
 * @param {!String} task   The task to handle.
 * @param {!String} target The target being handled.
 */
ScriptsComponent.prototype._handleTask = function _handleTask(task, target) {
  var config = this._tasks[task];
  verify.notNullObject(
      config,
      "Invalid task '" + task + "' configuration for '" + this._name + "'"
  );
  verify.notEmptyString(
      config.name,
      "Configuration for task '" + task +
      "' does not name a multitask to configure."
  );

  var key = Component.escapeName(this._name);
  var task_config = this._expandValue(target, config.config) || {};
  var task_name   = config.name;
  this._grunt.config(
      task_name + "." + target + "\\." + key + "\\." + task,
      task_config
  );
  this._grunt.task.run(
      task_name + ":" + target + "." + this._name + "." + task
  );
};

/**
 * Handles the execution of a script or a task, based on the name.
 * @param {!String} task_or_script The name of the script or task to handle.
 * @param {!String} target The target being handled.
 */
ScriptsComponent.prototype._handleTaskOrScript = function _handleTaskOrScript(
    task_or_script, target
) {
  if (task_or_script[0] === "!") {
    this._handleTask(task_or_script.substring(1), target);
  } else {
    this._handleScript(task_or_script, target);
  }
};

//@override
ScriptsComponent.prototype._process_targets = function _process_targets(
    config
) {
  Component.prototype._process_targets.call(this, config);
  verify.optionalObject(
      config.scripts,
      "The scripts attribute must be an object, if specified."
  );
  verify.optionalObject(
      config.tasks,
      "The tasks attribute must be an object, if specified."
  );

  // Validate and add target's tasks.
  var _this   = this;
  var specs   = config.targets;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target) {
    var tasks = specs[target].tasks;

    if (Array.isArray(tasks)) {
      tasks.forEach(function(task) {
        _this._validateTaskOrScript(task);
      });

    } else {
      _this._validateTaskOrScript(tasks);
    }

    _this._targets[target].tasks = tasks;
  });
};

/**
 * Expands a string (or array of strings) through grunt's template.
 * @param {!String|!Array.<!String>} template The array/string to process.
 * @param {!String} target The target to process for.
 * @returns {!String|!Array.<!String>} The expanded array/string.
 */
ScriptsComponent.prototype._template = function _template(template, target) {
  var _this = this;
  var grunt = this._grunt;
  var data  = {
    path: this._path,
    target: target
  };

  // If we are expanding an array, process each item.
  if (Array.isArray(template)) {
    return template.map(function(element) {
      return _this._template(element, target);
    });
  }

  // If we are expanding an object process each attribute.
  if (template !== null && typeof template === "object") {
    var obj = {};
    Object.keys(template).forEach(function(key) {
      if (typeof template[key] === "string") {
        obj[key] = _this._template(template[key], target);
      } else {
        obj[key] = template[key];
      }
    });
    return obj;
  }

  // Otherwise just process the template.
  return this._grunt.template.process(template, { data: data });
};

/**
 * Validates the configuration.
 * @param {!Object} configuration The configuration to validate.
 */
ScriptsComponent.prototype._validate = function _validate(configuration) {
  verify.notEmptyString(configuration.path, "Component path not valid");

  // Clear-path is either array or array of strings.
  var clear_path = configuration["clear-path"];
  if (Array.isArray(clear_path)) {
    clear_path.forEach(function (path) {
      verify.notEmptyString(path, "Component clear-path contains invalid path");
    });
  } else if (clear_path === null || typeof clear_path !== "object") {
    verify.notEmptyString(clear_path, "Component clear-path not valid");
  }
};

/**
 * Validates that the given name is an existing task or script.
 * @param {!String} task_or_script The name of the script or task to check.
 */
ScriptsComponent.prototype._validateTaskOrScript = function
_validateTaskOrScript(task_or_script) {
  verify.notEmptyString(
      task_or_script,
      "Scripts target must have one or more string tasks."
  );

  if (task_or_script[0] === "!") {
    task_or_script = task_or_script.substring(1);
    if (!(task_or_script in this._tasks)) {
      throw new Error("Undefined task " + task_or_script);
    }

  } else if (!(task_or_script in this._scripts)) {
    throw new Error("Undefined script " + task_or_script);
  }
};

//@override
ScriptsComponent.prototype.getCppHeaders = function getCppHeaders(target) {
  if (this._include_path) {
    return this._template(this._include_path, target);
  }
  return [path.join(this._path, "include")];
};

//@override
ScriptsComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._template(this._clear_path, target);
};

//@override
ScriptsComponent.prototype.getDynamicLibs = function getDynamicLibs(target) {
  return this._template(this._dynamic_libs, target);
};

//@override
ScriptsComponent.prototype.getStaticLibs = function getStaticLibs(target) {
  return this._template(this._static_libs, target);
};

//@override
ScriptsComponent.prototype.handleAnalysis = function handleAnalysis() {
  var message = (
      "Scripts analysis attribute must be a valid string " +
      "(or array of strings)."
  );

  if (Array.isArray(this._analysis)) {
    var _this = this;
    this._analysis.forEach(function(task_or_script) {
      verify.notEmptyString(task_or_script, message);
      _this._handleTaskOrScript(task_or_script, "analysis");
    });

  } else {
    verify.notEmptyString(this._analysis, message);
    this._handleTaskOrScript(this._analysis, "analysis");
  }
};

//@override
ScriptsComponent.prototype.handleTarget = function handleTarget(target) {
  verify.notEmptyString(target, "Target not valid");

  var _this = this;
  var tasks = this._targets[target].tasks;
  if (Array.isArray(tasks)) {
    tasks.forEach(function (task) {
      _this._handleTaskOrScript(task, target);
    });

  } else {
    this._handleTaskOrScript(tasks, target);
  }
};
