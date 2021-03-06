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
  strict:   false,
  trailing: true,
  maxlen:   80
};

var JSHINT_KNOWN_GLOBALS = {
  // node.js
  console: false,
  module:  false,
  process: false,
  require: false,

  // mocha.js
  setup: false,
  suite: false,
  test:  false
};

var MOCHA_DEFAULTS = {
  ignoreLeaks: false,
  reporter: "mocha-jenkins-reporter",
  ui: "tdd"
};


var NodeJS = module.exports = function NodeJS(configuration) {
  Component.call(this, configuration);
  this._path = configuration.path;
  this._jshint_conf = configuration.jshint || {};
  this._mocha_conf  = configuration.mocha || {};
};
NodeJS.prototype = Object.create(Component.prototype);
NodeJS.JSHINT_DEFAULTS = JSHINT_DEFAULTS;
NodeJS.JSHINT_KNOWN_GLOBALS = JSHINT_KNOWN_GLOBALS;


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
  var root  = path.join("out", "dist", target, this._path, "module", "deps");

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
 * Copies the source files and npm package files to the distribution directory.
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 * @param {!String} target The target being compiled.
 */
NodeJS.prototype._copySources = function _copySources(key, name, target) {
  var root  = path.join("out", "dist", target, this._path, "module");
  var mappings = [{
    expand: true,
    cwd:  path.join(this._path, "src"),
    dest: root,
    src:  ["**/*.js", "!node_modules/**"]
  }, {
    expand: true,
    cwd:  this._path,
    dest: path.join(root),
    src:  ["package.json"]
  }];

  this._grunt.loadNpmTasks("grunt-contrib-copy");
  this._grunt.config("copy." + key, { files: mappings });
  this._grunt.task.run("copy:" + name);
};

/**
 * Copyes the test files to the test distribution directory.
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 */
NodeJS.prototype._copyTests = function _copyTests(key, name) {
  var base_path = path.join("out", "dist", "test", this._path);
  this._grunt.config("copy." + key + "\\.tests", {
    files: [{
      expand: true,
      cwd:  path.join(this._path, "tests"),
      dest: path.join(base_path, "tests"),
      src:  ["**/*.js", "!node_modules/**"]
    }]
  });
  this._grunt.task.run("copy:" + name + ".tests");
};

/**
 * Configures and enqueues JsHint for the project.
 * Node modules and external dependencies are not linted.
 * Configuration is loaded from component.json to override the above default.
 * 
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 */
NodeJS.prototype._lintSources = function(key, name) {
  // Generate configuration.
  var config = {};
  var user_conf = this._jshint_conf;

  Object.keys(JSHINT_DEFAULTS).forEach(function(key) {
    config[key] = JSHINT_DEFAULTS[key];
  });
  Object.keys(user_conf).forEach(function(key) {
    config[key] = user_conf[key];
  });

  // Ensure that default node.js globals are registered with JsHint.
  if (!config.globals) {
    config.globals = {};
  }
  Object.keys(JSHINT_KNOWN_GLOBALS).forEach(function(known_global) {
    if (!config.globals.hasOwnProperty(known_global)) {
      config.globals[known_global] = JSHINT_KNOWN_GLOBALS[known_global];
    }
  });

  var base_path = path.join("out", "dist", "test", this._path);
  this._grunt.loadNpmTasks("grunt-contrib-jshint");
  this._grunt.config("jshint." + key, {
    options: config,
    files: {
      src: [
        path.join(base_path, "**", "*.js"),
        "!" + path.join(base_path, "module", "deps", "**"),
        "!**/node_modules/**"
      ]
    }
  });
  this._grunt.task.run("jshint:" + name);
};

/**
 * Runs mocha tests on the component.
 * Npm installs dependencies before running the tests.
 * 
 * @param {!String} key  The base configuration key for generated tasks.
 * @param {!String} name The base task name for generated tasks.
 */
NodeJS.prototype._test = function _test(key, name) {
  // Configure npm and mocha tests.
  var base_path  = path.join("out", "dist", "test", this._path);
  var mocha_conf = {};
  var mocha_user = this._mocha_conf;

  Object.keys(MOCHA_DEFAULTS).forEach(function(key) {
    mocha_conf[key] = MOCHA_DEFAULTS[key];
  });
  Object.keys(mocha_user).forEach(function(key) {
    mocha_conf[key] = mocha_user[key];
  });

  // Deal with XML generating reporter.
  var xml_reporter = mocha_conf.reporter === "mocha-jenkins-reporter";
  var write_report = !this._grunt.option("no-write");

  if (xml_reporter && write_report) {
    var report_dir = path.join("out", "reports", this._path);
    var report_path = path.join(report_dir, "test-results.xml");

    mocha_conf.reporterOptions = {};
    mocha_conf.reporterOptions.junit_report_name = this.name();
    mocha_conf.reporterOptions.junit_report_path = report_path;
  }

  this._grunt.config("npm-install." + key, {
    options: {
      dest: path.join(base_path, "module")
    }
  });
  this._grunt.config("mochaTest." + key, {
    options: mocha_conf,
    src: path.join(base_path, "tests", "**", "test_*.js")
  });

  // Schedule tasks.
  this._grunt.task.run("npm-install:" + name);
  this._grunt.task.run("mochaTest:" + name);
};


//@override
NodeJS.prototype.getCleanPath = function getCleanPath(target) {
  var paths = [
    path.join("out", "build", target, this._path),
    path.join("out", "dist",  target, this._path),
    path.join("out", "reports", this._path)
  ];
  return paths;
};

//@Override
NodeJS.prototype.getOutput = function getOutput(target) {
  return {
    expand: true,
    cwd: path.join("out", "dist", target, this._path, "module"),
    src: "**"
  };
};

//@override
NodeJS.prototype.handleAnalysis = function handleAnalysis(components) {
  var key  = "test\\." + Component.escapeName(this._name);
  var name = "test." + this._name;

  this._copyTests(key, name);
  this._lintSources(key, name);
  this._test(key, name);
  // TODO(stefano): Coverage results.
};

//@override
NodeJS.prototype.handleTarget = function handleTarget(target, components) {
  var key  = target + "\\." + Component.escapeName(this._name);
  var name = target + "." + this._name;

  this._copySources(key, name, target);
  this._copyDependencies(key, name, target, components);
};
