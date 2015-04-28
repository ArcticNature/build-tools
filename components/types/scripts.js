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
  this._grunt = configuration.grunt;
  this._path  = configuration.path;
  this._clear_path = configuration["clear-path"];
};
ScriptsComponent.prototype = Object.create(Component.prototype);

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
  verify.notNullObject(configuration.grunt, "Grunt instance not valid");
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
ScriptsComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._template(this._clear_path, target);
};
