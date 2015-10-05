var path = require("path");
var Component = require("../component");


var JSHINT_DEFAULTS = {
  curly:    true,
  eqeqeq:   true,
  freeze:   true,
  immed:    true,
  indent:   2,
  latedef:  true,
  newcap:   true,
  noarg:    true,
  noempty:  true,
  nonbsp:   true,
  nonew:    true,
  quotmark: true,
  undef:    true,
  unused:   true,
  strict:   true,
  trailing: true,
  maxlen:   80
};


var NodeJS = module.exports = function NodeJS(configuration) {
  Component.call(this, configuration);
  this._path = configuration.path;
  this._jshint_conf = configuration.jshint || {};
};
NodeJS.prototype = Object.create(Component.prototype);
NodeJS.JSHINT_DEFAULTS = JSHINT_DEFAULTS;


/**
 * Copies the soirce files and npm package files to the distribution directory.
 * @param {!String} key    The base configuration key for generated tasks.
 * @param {!String} name   The base task name for generated tasks.
 * @param {!String} target The target being compiled.
 * @param {!Object} components The components register.
 */
NodeJS.prototype._copyDependencies = function _copyDependencies(
    key, name, target, components
) {
  var deps  = components.resolve(this._name, target);
  var files = [];
  var root  = path.join("out", "dist", target, this._path, "deps");

  deps.pop();
  deps.forEach(function(dep) {
    var dep_files = dep.instance.getNodeJsDependencies(dep.target);

    dep_files.forEach(function(dep_file) {
      dep_file.dest = path.join(root, dep.instance.name());
    });

    files.push.apply(files, dep_files);
  });

  if (files.length !== 0) {
    this._grunt.config("copy." + key + "\\.deps", { files: files });
    this._grunt.task.run("copy:" + name + ".deps");
  }
};

/**
 * Copies the soirce files and npm package files to the distribution directory.
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 * @param {!String} target The target being compiled.
 */
NodeJS.prototype._copySources = function _copySources(key, name, target) {
  var mappings = [{
    expand: true,
    cwd:  path.join(this._path, "src"),
    dest: path.join("out", "dist", target, this._path),
    src:  ["**/*.js", "!node_modules/**"]
  }, {
    expand: true,
    cwd:  this._path,
    dest: path.join("out", "dist", target, this._path),
    src:  ["package.json"]
  }];

  this._grunt.loadNpmTasks("grunt-contrib-copy");
  this._grunt.config("copy." + key, { files: mappings });
  this._grunt.task.run("copy:" + name);
};

/**
 * Configures and enqueues JsHint for the project.
 * Node modules and external dependencies are not linted.
 * 
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 */
NodeJS.prototype._lintSources = function(key, name) {
  var config = {};
  var user_conf = this._jshint_conf;

  Object.keys(JSHINT_DEFAULTS).forEach(function(key) {
    config[key] = JSHINT_DEFAULTS[key];
  });
  Object.keys(user_conf).forEach(function(key) {
    config[key] = user_conf[key];
  });

  this._grunt.loadNpmTasks("grunt-contrib-jshint");
  this._grunt.config("jshint." + key, {
    options: config,
    files: {
      src: [
        path.join("out", "dist", "test", this._path, "**", "*.js"),
        "!" + path.join("out", "dist", "test", this._path, "deps", "**"),
        "!**/node_modules/**"
      ]
    }
  });
  this._grunt.task.run("jshint:" + name);
};


//@override
NodeJS.prototype.getCleanPath = function getCleanPath(target) {
  var paths = [
    path.join("out", "build", target, this._path),
    path.join("out", "dist",  target, this._path)
  ];
  return paths;
};

//@override
NodeJS.prototype.handleAnalysis = function handleAnalysis(components) {
  var key  = "test\\." + this._name;
  var name = "test." + this._name;

  // Lint source (config from component.json with additional configuration).
  this._lintSources(key, name);

  // npm install
  // mocha test execution.
  // Coverage results.
};

//@override
NodeJS.prototype.handleTarget = function handleTarget(target, components) {
  var key  = target + "\\." + this._name;
  var name = target + "." + this._name;

  this._copySources(key, name, target);
  this._copyDependencies(key, name, target, components);
};
