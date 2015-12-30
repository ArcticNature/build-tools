var path = require("path");

var Component = require("../component");
var verify = require("../../utils/verify");

/**
 * @class TemplatesComponent
 * Component to expand handlebars templates.
 *
 * @param {!Object} config The configuration of the component.
 */
var TemplatesComponent = module.exports = function TemplatesComponent(config) {
  Component.call(this, config);

  // Store config.
  this._defaults  = config.defaults  || null;
  this._templates = config.templates || {};

  this._targets = config.targets || {};
  this._path = config.path;
};
TemplatesComponent.prototype = Object.create(Component.prototype);


TemplatesComponent.prototype._loadData = function _loadData(data) {
  if (!data) {
    return {};
  }
  return this._grunt.file.readJSON(path.join(this._path, data));
};


TemplatesComponent.prototype._processTemplate = function _processTemplate(
  dest, target, components
) {
  // Build data object.
  var data = {};
  var target_conf = this._targets[target] || {};
  var target_data = target_conf.data || {};

  var defaults = this._loadData(this._defaults);
  var override = this._loadData(target_data[dest]);

  Object.keys(defaults).forEach(function(attr) {
    data[attr] = defaults[attr];
  });
  Object.keys(override).forEach(function(attr) {
    data[attr] = override[attr];
  });

  // Set internal data.
  data.__BUILD_TARGET__ = target;

  // Build task key.
  var name = this._name + "." + target + "." + dest;
  var key  = "handlebars." + Component.escapeName(name);

  // Enqueue and configure task.
  var template = this._templates[dest];
  this._grunt.task.run("handlebars:" + name);
  this._grunt.config(key, {
    files: [{
      src:  path.join(this._path, template),
      dest: path.join("out", "build", target, this._path, dest)
    }],
    options: {
      data: data
    }
  });
};

TemplatesComponent.prototype._templatePaths = function _templatePaths(target) {
  var base_path = path.join("out", "build", target, this._path);
  return Object.keys(this._templates).map(function(file) {
    return path.join(base_path, file);
  });
};


// Override
TemplatesComponent.prototype.getCleanPath = function getCleanPath(target) {
  return path.join("out", "build", target, this._path);
};

// Override
TemplatesComponent.prototype.getCppHeaders = function getCppHeaders(target) {
  // Find headers (they must be in an /include/ directory).
  var headers = this._templatePaths(target).filter(function(path) {
    var idx = path.search("/include/");
    return path.substr(path.length - 2) === ".h" && idx !== -1;
  });

  // Get the paths to /include/ only.
  return headers.map(function(header) {
    var idx = header.search("/include/");
    return header.substr(0, idx + 8);
  });
};

// Override
TemplatesComponent.prototype.getOutput = function getOutput(target) {
  return {
    expand: true,
    src: this._templatePaths(target)
  };
};

// Override
TemplatesComponent.prototype.handleAnalysis = function handleAnalysis(
  components
) {
  this._grunt.log.ok("Skipping analisys of templates.");
};

// Override
TemplatesComponent.prototype.handleTarget = function handleTarget(
  target, components
) {
  var _this = this;
  Object.keys(this._templates).forEach(function(dest) {
    _this._processTemplate(dest, target, components);
  });
};
