var assert = require("assert");
var grunt  = require("grunt");


/**
 * @class GruntConfigMock
 * Mocks the grunt.config instance.
 */
var GruntConfigMock = function GruntConfigMock() {
  this._config = {};
};

GruntConfigMock.prototype.createCallable = function createCallable() {
  var callable = this.smartAccess.bind(this);

  // Copy public methods.
  for (var prop in this) {
    // If the object or its prototype do not have the property skip it.
    if (
        !this.hasOwnProperty(prop) &&
        !GruntConfigMock.prototype.hasOwnProperty(prop)
    ) {
      continue;
    }
    // If it is not callable or is private skip too.
    if (!this[prop] || !this[prop].bind) { continue; }
    if (prop[0] === '_') { continue; }
    callable[prop] = this[prop].bind(this);
  }

  return callable;
};

/**
 * Returns a config option or null.
 * @param {!String} name The option to return.
 * @returns {*} the value of the option.
 */
GruntConfigMock.prototype.get = function get(name) {
  if (name in this._config) {
    return this._config[name];
  }
  return null;
};

/**
 * Ensures that all the requested configuration options are set.
 * @param {!String...} names The options to check.
 */
GruntConfigMock.prototype.requires = function requires(/* varargs */) {
  var _this = this;
  Array.prototype.forEach.call(arguments, function(name) {
    if (!(name in _this._config)) {
      throw new Error("Missing required configuration '" + name + "'");
    }
  });
};

/**
 * Sets a config option.
 * @param {!String} name  The name of the option to set.
 * @param {*}       value The value to set the option to.
 */
GruntConfigMock.prototype.set = function set(name, value) {
  this._config[name] = value;
};

/**
 * Proxy calls to get or set based on the number of aguments.
 * @param {!String} name  The option to get/set.
 * @param {*}       value If not undefined will call set(name, value).
 */
GruntConfigMock.prototype.smartAccess = function smartAccess(name, value) {
  if (typeof value === "undefined") {
    return this.get(name);
  }
  return this.set(name, value);
};

/** Asserts that the grunt configuration is empty. */
GruntConfigMock.prototype.assertEmpty = function assertEmpty() {
  assert.deepEqual(this._config, {}, "Cnfiguration not empty");
};


/**
 * @class GruntFileMock
 * Mocks grunt.file.
 */
var GruntFileMock = function GruntFileMock() {
  this._files = {};
  this.mapped = [];
  this.wrote  = {};

  // Alias some functions to the original version.
  this.copy  = grunt.file.copy;
  this.mkdir = grunt.file.mkdir;
};

GruntFileMock.prototype.expand = function expand() {
  return [];
};

GruntFileMock.prototype.expandMapping = function expandMapping(src, dst, opts) {
  var mappings = grunt.file.expandMapping(src, dst, opts);
  this.mapped.push({
    destination: dst,
    mappings: mappings,
    options:  opts,
    sources:  src
  });
  return mappings;
};

GruntFileMock.prototype.exists = function exists(path) {
  return path in this._files;
};

GruntFileMock.prototype.read = function read(file) {
  if (file in this._files) {
    return this._files[file];
  }
  assert.fail("in", "not in", "Unepxected read of file " + file);
};

GruntFileMock.prototype.write = function read(path, content) {
  this.wrote[path] = content;
};


/**
 * Asserts that the given path was not written to.
 * @param {!String} path The path to check.
 */
GruntFileMock.prototype.assert_did_not_write = function assert_did_not_write(
    path
) {
  if (!(path in this.wrote)) { return; }
  throw new assert.AssertionError({
    message: "Should not have written to '" + path + "'"
  });
};

/**
 * Asserts that the given path was written to.
 * @param {!String} path The path to check.
 */
GruntFileMock.prototype.assert_wrote_to_path = function assert_wrote_to_path(
    path
) {
  if (path in this.wrote) { return; }
  assert.fail(
      path, Object.keys(this.wrote).sort(), null,
      "was not found in written files"
  );
};

/**
 * Configures the files read by grunt.file.read.
 * @param {!Object} files A map from file name to content.
 */
GruntFileMock.prototype.set_files = function set_files(files) {
  this._files = files;
};


/**
 * @class GruntLog
 * Mocks grunt.log.
 */
var GruntLog = function GruntLog() {
  this.verbose = new GruntVerboseLog();
  this.ok_logs = [];
};
GruntLog.prototype.ok = function ok(text) {
  this.ok_logs.push(text);
};
GruntLog.prototype.write   = function write() {};
GruntLog.prototype.writeln = function writeln() {};


/**
 * @class GruntTaskMock
 * Mock the grunt.task instance.
 */
var GruntTaskMock = function GruntTaskMock() {
  this._queue = [];
};

/**
 * Enqueues a task to be run.
 * @param {!String|!Array} task The task to enqueue.
 */
GruntTaskMock.prototype.run = function run(task) {
  if (Array.isArray(task)) {
    this._queue.push.apply(this._queue, task);
  } else {
    this._queue.push(task);
  }
};

/**
 * Assers that the task queue is in the expected state.
 * @param {!Array.<!String>} queue The expected queue.
 */
GruntTaskMock.prototype.assertTaskQueue = function assertTaskQueue(queue) {
  assert.deepEqual(this._queue, queue);
};

/**
 * @class GruntThisMock
 * Mocks this context inside a grunt task.
 * 
 * @param {!String} name  The task running.
 * @param {!Object} grunt The grunt instance.
 */
var GruntThisMock = function GruntThisMock(name, grunt) {
  this.name   = name;
  this._grunt = grunt;

  this._is_async = false;
  this._callback = null;
};

/** @returns {!Function} Returns the async callback. */
GruntThisMock.prototype.async = function async() {
  this._is_async = true;
  return this._callback;
};

GruntThisMock.prototype.options = function options(defaults, source) {
  var result = {};

  // Copy defaults.
  Object.keys(defaults).forEach(function(key) {
    result[key] = defaults[key];
  });

  // Extend results.
  Object.keys(source).forEach(function(key) {
    result[key] = source[key];
  });

  return result;
};


/**
 * @class GruntMock
 * Mocks a grunt instance to allow testing.
 */
var GruntMock = module.exports = function GruntMock() {
  this._tasks = {};

  this.config = (new GruntConfigMock()).createCallable();
  this.file   = new GruntFileMock();
  this.log    = new GruntLog();
  this.task   = new GruntTaskMock();

  // Not everything needs mocking.
  this.option   = grunt.option;
  this.template = grunt.template;
};


/**
 * Registers a simple task.
 * @param {!String}   name The name of the task to register.
 * @param {?String}   desc The description of the task.
 * @param {!Function} task The task itself.
 */
GruntMock.prototype.registerTask = function registerTask(name, desc, task) {
  if (name in this._tasks) {
    throw new Error("Task '" + name + "' already defined");
  }
  this._tasks[name] = task;
};

/**
 * Registers a multitask.
 * @param {!String}   name The name of the task to register.
 * @param {?String}   desc The description of the task.
 * @param {!Function} task The task itself.
 */
GruntMock.prototype.registerMultiTask = function registerMultiTask(
    name, desc, task
) {
  return this.registerTask(name, desc, task);
};


/**
 * Asserts that a simple task is registered.
 * @param {!String} name The name of the task to check.
 */
GruntMock.prototype.assertHasTask = function assertHasTask(name) {
  if (!(name in this._tasks)) {
    assert.fail(null, name, "simple task '" + name + "' not registered");
  }
};

/**
 * Runs a registered task with the given parameters.
 * @param {!String} name The task to run.
 * @returns {*} the return value of the task.
 */
GruntMock.prototype.testTask = function testTask(name/*, varargs */) {
  this.assertHasTask(name);
  return this._tasks[name].apply(
      new GruntThisMock(name, this),
      Array.prototype.slice.call(arguments, 1)
  );
};

/**
 * Runs a registered task with the given parameters.
 * @param {!String} name The task to run.
 * @returns {!TestTaskCaller} the return value of the task.
 */
GruntMock.prototype.taskCaller = function taskCaller(name) {
  this.assertHasTask(name);
  return new TestTaskCaller(this, name);
};


/**
 * @class GruntVerboseLog
 * Mocks grunt.log.verbose.
 */
var GruntVerboseLog = function GruntVerboseLog() {};
GruntVerboseLog.prototype.error = function error() {};
GruntVerboseLog.prototype.ok = function ok() {};


/**
 * @class TestTaskCaller
 * Helper class to test grunt task execution.
 * 
 * @param {!Object} mock The GruntMock that owns the task.
 * @param {!String} name The name of the task to run.
 */
var TestTaskCaller = function TestTaskCaller(mock, name) {
  this._mock = mock;
  this._name = name;

  this._callback = null;
  this._data = {};
};

/**
 * Sets the callback function for when the task completes.
 * @param {!Function} done The done callback.
 */
TestTaskCaller.prototype.async = function async(done) {
  this._callback = done;
};

/**
 * Sets the task data.
 * @param {*} data The data for the task.
 */
TestTaskCaller.prototype.data = function data(data) {
  this._data = data;
};

/** Runs the task. */
TestTaskCaller.prototype.run = function run(/* varargs */) {
  var task = this._mock._tasks[this._name];
  var task_this  = new GruntThisMock(this._name, this._mock);

  // Populate task configuration.
  task_this._callback = this._callback;
  task_this.data = this._data;

  // Deal with the callback too.
  try {
    var result = task.apply(task_this, arguments);
    if (!task_this._is_async && this._callback) {
      this._callback();
    }
    return result;

  } catch (ex) {
    if (task_this._is_async && this._callback) {
      this._callback(ex);
      return;
    }

    // Re-throw the exception for sync tasks.
    throw ex;
  }
};