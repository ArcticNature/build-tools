var TARGET_ORDER = ["release", "debug", "test"];

var filter_priority_target = function filter_priority_target(targets) {
  var priorities = {};
  targets = targets.map(function(dep) {
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

    priorities[name] = max_target(priorities[name], target);
    return {
      name:   name,
      target: target
    };
  });

  return targets.filter(function(dep) {
    return priorities[dep.name] === dep.target;
  });
};

var max_target = function max_target(left, right) {
  var l = TARGET_ORDER.indexOf(left);
  var r = TARGET_ORDER.indexOf(right);
  return l > r ? left : right;
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

DepsManager.prototype._depthFirstSearch = function _depthFirstSearch(
    node, results, visited
) {
  // Mark node as visited.
  results = results || [];
  visited = visited || {};
  visited[node.target + "." + node.name] = true;

  // Visit current node.
  results.push(node);

  // Iterate over linked nodes.
  var nodes = this._projects[node.name].targets[node.target].deps;
  for (var idx=nodes.length-1; idx>=0; idx--) {
    var next_node = nodes[idx];
    var found = visited[next_node.target + "." + next_node.name];

    if (!found) {
      this._depthFirstSearch(next_node, results, visited);
    }
  }

  var res = filter_priority_target(results);
  res.reverse();
  return res;
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
  var current  = tasks.pop();
  var includes = [];
  includes.push.apply(
      includes, this._projects[current.name].targets[current.target].include
  );

  for (var idx=0; idx<tasks.length; idx++) {
    var task = tasks[idx];
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
  tasks.pop();

  var libs = [];
  for (var idx=0; idx<tasks.length; idx++) {
    var task    = tasks[idx];
    var project = this._projects[task.name];
    var ptarget = project.targets[task.target];

    if (ptarget.type !== "lib") {
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
  });
  tasks.pop();
  return tasks.map(function(task) {
    return task.target + "." + task.name;
  });
};