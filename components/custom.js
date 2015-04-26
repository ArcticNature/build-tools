var path = require("path");

var Component = require("./component");
var verify = require("../utils/verify");


/**
 * @class CustomComponent
 * Component definition for highliy customised components that follow
 * very few common rules.
 * An example of a custom component is the 'version' component.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var CustomComponent = module.exports = function CustomComponent(configuration) {
  Component.call(this, configuration);
  verify.notEmptyString(configuration.path, "Missing component path");

  this._path = configuration.path;
};
CustomComponent.prototype = Object.create(Component.prototype);

//@override
CustomComponent.prototype.getCleanPath = function getCleanPath(target) {
  return this._path;
};
