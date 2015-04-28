var assert = require("assert");


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
 * @class GruntMock
 * Mocks a grunt instance to allow testing.
 */
var GruntMock = module.exports = function GruntMock() {
  this._tasks = {};

  this.config = (new GruntConfigMock()).createCallable();
  this.task   = new GruntTaskMock();
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
      this._insideTask, Array.prototype.slice.call(arguments, 1)
  );
};
