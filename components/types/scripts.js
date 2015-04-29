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
 * Handles the execution of a script target.
 * @param {!String} script The name of the script to handle.
 * @param {!string} target The target being handled.
 */
ScriptsComponent.prototype._handleScript = function _handleScript(
    script, target
) {
  var command = this._scripts[script];
  this._grunt.config("shell." + target + "\\." + script, {
    command: this._template(command, target)
  });
  this._grunt.task.run("shell:" + target + "." + script);
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

  this._scripts = config.scripts;

  // Validate and add target's tasks.
  var _this   = this;
  var specs   = config.targets;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target) {
    verify.notEmptyString(
      specs[target].tasks,
      "Scripts target must have one or more string tasks."
    );
    var config = _this._targets[target];
    var tasks  = specs[target].tasks;

    if (!(tasks in _this._scripts)) {
      throw new Error("Undefined script " + tasks);
    }

    config.tasks = tasks;
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

//@override
ScriptsComponent.prototype.handleTarget = function handleTarget(target) {
  verify.notEmptyString(target, "Target not valid");

  var config = this._targets[target];
  this._handleScript(config.tasks, target);
};

//@override
ScriptsComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._template(this._clear_path, target);
};
