var path = require("path");

var Component = require("./component");
var verify = require("../utils/verify");


/**
 * @class CppComponent
 * C++ component definiton.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var CppComponent = module.exports = function CppComponent(configuration) {
  Component.call(this, configuration);
  verify.notEmptyString(configuration.path, "Missing component path");

  this._path = configuration.path;
};
CppComponent.prototype = Object.create(Component.prototype);

//@override
CppComponent.prototype.getCleanPath = function getCleanPath(target) {
  return path.join("out", "*", target, this._path);
};
