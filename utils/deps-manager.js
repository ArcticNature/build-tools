var TARGET_ORDER = ["release", "debug", "test"];


var filter_priority_target = function filter_priority_target(tasks) {
  // Find highest proiority for each task.
  var priorities = {};
  tasks = tasks.map(function(dep) {
    var name   = null;
    var target = null;

    if (typeof dep === "string") {
      var parts = dep.split(".");
      name   = parts[1];
      target = parts[0];
    } else {
      name   = dep.name;
      target = dep.target;
    }

    priorities[name] = DepsManager.maxTarget(priorities[name], target);
    return {
      name:   name,
      target: target
    };
  });

  // Promote tasks to the highest priority.
  tasks = tasks.map(function(task) {
    task.target = priorities[task.name];
    return task;
  });

  // Remove duplicate tasks.
  var seen_tasks = {};
  return tasks.filter(function(task) {
    var seen = seen_tasks[task.name];
    seen_tasks[task.name] = true;
    return !seen;
  });
};

var merge_arrays = function merge_arrays(left, right) {
  var seen = {};
  var result = [];
  left  = left  || [];
  right = right || [];

  for (var idx=0; idx<left.length; idx++) {
    if (!(left[idx] in seen)) {
      seen[left[idx]] = true;
      result.push(left[idx]);
    }
  }

  for (var idx=0; idx<right.length; idx++) {
    if (!(right[idx] in seen)) {
      seen[right[idx]] = true;
      result.push(right[idx]);
    }
  }

  return result;
};

var process_dependencies = function process_dependencies(target, deps, global) {
  var apply_default = function apply_default(dep) {
    var parts = dep.split(".");
    if (parts.length === 1) {
      return (target === "release" ? "release" : "debug") + "." + dep;
    }
    return dep;
  };

  deps   = (deps   || []).map(apply_default);
  global = (global || []).map(apply_default);
  return filter_priority_target(merge_arrays(deps, global));
};


var DepsManager = module.exports = function DepsManager(grunt) {
  this._grunt    = grunt;
  this._projects = {};
};

DepsManager.maxTarget = function maxTarget(left, right) {
  var l = TARGET_ORDER.indexOf(left);
  var r = TARGET_ORDER.indexOf(right);
  return l > r ? left : right;
};

DepsManager.prototype._depthFirstSearch = function _depthFirstSearch(
    node, results, visited
) {
  // Mark node as visited.
  results = results || [];
  visited = visited || {};
  visited[node.target + "." + node.name] = true;

  // Iterate over linked nodes.
  var nodes = this._projects[node.name].targets[node.target].deps;
  //for (var idx=nodes.length-1; idx>=0; idx--) {
  for (var idx=0; idx<nodes.length; idx++) {
    var next_node = nodes[idx];
    var found = visited[next_node.target + "." + next_node.name];

    if (!found) {
      this._depthFirstSearch(next_node, results, visited);
    }
  }

  // Visit current node.
  results.push(node);
  return filter_priority_target(results);
};

DepsManager.prototype.getExcludes = function getExcludes(name, target) {
  if (!this.targetExists(name, target)) {
    return [];
  }
  return this._projects[name].targets[target].exclude;
};

DepsManager.prototype.getProjectMetadata = function getProjectMetadata(name) {
  return {
    name: name,
    path: this._projects[name].path
  };
};

DepsManager.prototype.getTypeForTarget = function getTypeForTarget(
    name, target
) {
  if (!this.targetExists(name, target)) {
    return null;
  };
  return this._projects[name].targets[target].type || null;
};

DepsManager.prototype.targetExists = function targetExists(name, target) {
  return name in this._projects && target in this._projects[name].targets;
};

DepsManager.prototype.project = function project(configuration) {
  var targets = {};

  // Process targets.
  for (var target in configuration.targets) {
    if (!configuration.targets.hasOwnProperty(target)) { continue; }
    var spec = configuration.targets[target];

    targets[target] = {
      deps:    process_dependencies(target, spec.deps, configuration.deps),
      exclude: merge_arrays(spec.exclude, configuration.exclude),
      include: merge_arrays(spec.include, configuration.include),
      libs:    merge_arrays(spec.libs, configuration.libs),
      type:    spec.type || null
    };
  }

  // Register the project.
  this._projects[configuration.name] = {
    name: configuration.name,
    path: configuration.path,
    targets: targets
  };
};

DepsManager.prototype.resolveIncludes = function resolveIncludes(name, target) {
  if (!this.targetExists(name, target)) {
    return [];
  }

  var tasks = this._depthFirstSearch({
    name:   name,
    target: target
  });

  var includes = [];
  includes.push.apply(includes, this._projects[name].targets[target].include);

  for (var idx=0; idx<tasks.length; idx++) {
    var task = tasks[idx];
    if (task.name === name && task.target === target) {
      continue;
    }
    includes.push(this._projects[task.name].path + "/include");
  }

  return includes;
};

DepsManager.prototype.resolveLibraries = function resolveLibraries(
    name, target
) {
  if (!this.targetExists(name, target)) {
    return [];
  }
  return this._projects[name].targets[target].libs || [];
};

DepsManager.prototype.resolveStaticLibraries = function resolveStaticLibraries(
    name, target
) {
  if (!this.targetExists(name, target)) {
    return [];
  }

  var tasks = this._depthFirstSearch({
    name:   name,
    target: target
  });

  var libs = [];
  for (var idx=0; idx<tasks.length; idx++) {
    var task    = tasks[idx];
    var project = this._projects[task.name];
    var ptarget = project.targets[task.target];

    if (ptarget.type !== "lib" || (
        task.name === name && task.target === target
      )) {
      continue;
    }

    libs.push(
        "out/dist/" + task.target + "/" + project.path +
        "/" + project.name + ".a"
    );
  }

  libs.reverse();
  return libs;
};

DepsManager.prototype.resolveTasks = function resolveTasks(name, target) {
  if (!this.targetExists(name, target)) {
    return [];
  }

  var tasks = this._depthFirstSearch({
    name:   name,
    target: target
  }).filter(function(task) {
    return task.name !== name || task.target !== target;
  });

  return tasks.map(function(task) {
    return task.target + "." + task.name;
  });
};
