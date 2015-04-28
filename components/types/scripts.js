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
  verify.notEmptyString(configuration.path, "Missing component path");
  //verify.notNullObject(configuration.grunt, "Grunt instance not valid");

  this._grunt = configuration.grunt;
  this._path  = configuration.path;
  this._clear_path = configuration.clear_path;
};
ScriptsComponent.prototype = Object.create(Component.prototype);

ScriptsComponent.prototype._template = function _template(template, target) {
  var data = {
    path: this._path,
    target: target
  };
  return this._grunt.template.process(template, { data: data });
};

//@override
ScriptsComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._template(this._clear_path, target);
};
