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
  Component.call(this, configuration);
  this._validate(configuration);

  // Store configuration.
  this._path = configuration.path;
  this._clear_path = configuration["clear-path"];
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

  this._grunt.config("shell." + target + "\\." + script, {
    command: command
  });
  this._grunt.task.run("shell:" + target + "." + script);
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

  var task_config = this._expandValue(target, config.config) || {};
  var task_name   = config.name;
  this._grunt.config(task_name + "." + target + "\\." + task, task_config);
  this._grunt.task.run(task_name + ":" + target + "." + task);
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

  this._scripts = config.scripts || {};
  this._tasks   = config.tasks   || {};

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
  var grunt = this._grunt;
  var data  = {
    path: this._path,
    target: target
  };

  // If we are expanding an array, process each item.
  if (Array.isArray(template)) {
    return template.map(function(element) {
      return grunt.template.process(element, { data: data });
    });
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
  } else {
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

//@override
ScriptsComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._template(this._clear_path, target);
};
