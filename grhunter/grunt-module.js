var GruntModule = module.exports = function GruntModule() {
  this._alias = {};
  this._alias_more = {};
  this._load = {};
  this._load_npm = {};
  this._multi_tasks = {};
  this._tasks = {};
};


GruntModule.prototype._configureTask = function configure(task, config) {
  if (task in this._tasks) {
    throw new Error("Duplicate task " + task);
  }
  if (task in this._multi_tasks) {
    throw new Error("Task " + task + " already defined as a mutli task");
  }
  this._tasks[task] = config;
};

GruntModule.prototype._configureMultiTask = function configure(
    task, subtask, config
) {
  if (task in this._tasks) {
    throw new Error("Task " + task + " already defined as a simple task");
  }
  if (task in this._multi_tasks && subtask in this._multi_tasks[task]) {
    throw new Error("Duplicate mutli task " + task + ":" + subtask);
  }

  // Ensure multi task group exists.
  if (!(task in this._multi_tasks)) {
    this._multi_tasks[task] = {};
  }
  this._multi_tasks[task][subtask] = config;
};


GruntModule.prototype.alias = function alias(name, items) {
  if (name in this._alias || name in this._alias_more) {
    throw new Error("Alias " + name + " already defined");
  }
  this._alias[name] = items;
};

GruntModule.prototype.aliasMore = function aliasMore(name, items) {
  if (name in this._alias) {
    throw new Error("Alias " + name + " already defined");
  }
  if (!(name in this._alias_more)) {
    this._alias_more[name] = [];
  }

  if (!Array.isArray(items)) {
    items = [items];
  }
  Array.prototype.push.apply(this._alias_more[name], items);
};

GruntModule.prototype.configure = function configure(task, subtask, config) {
  if (config === undefined) {
    return this._configureTask(task, config);
  }
  return this._configureMultiTask(task, subtask, config);
};

GruntModule.prototype.loadNpmTasks = function loadNpmTasks(task) {
  this._load_npm[task] = true;
};
