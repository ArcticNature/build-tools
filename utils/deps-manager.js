var TARGET_ORDER = ["release", "debug", "test"];

var filter_priority_target = function filter_priority_target(targets) {
  var priorities = {};
  targets = targets.map(function(dep) {
    var name   = null;
    var target = null;

    if (typeof dep === "string") {
      var parts = dep.split(":");
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
    var parts = dep.split(":");
    if (parts.length === 1) {
      return (target === "release" ? "release" : "debug") + ":" + dep;
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
  visited[node.target + ":" + node.name] = true;

  // Visit current node.
  results.push(node);

  // Iterate over linked nodes.
  var nodes = this._projects[node.name].targets[node.target].deps;
  for (var idx=nodes.length-1; idx>=0; idx--) {
    var next_node = nodes[idx];
    var found = visited[next_node.target + ":" + next_node.name];

    if (!found) {
      this._depthFirstSearch(next_node, results, visited);
    }
  }

  var res = filter_priority_target(results);
  res.reverse();
  return res;
};

DepsManager.prototype.getProjectMetadata = function getProjectMetadata(name) {
  return {
    name: name,
    path: this._projects[name].path
  };
};

DepsManager.prototype.project = function project(configuration) {
  var targets = {};

  // Process targets.
  for (var target in configuration.targets) {
    if (!configuration.targets.hasOwnProperty(target)) { continue; }
    var spec = configuration.targets[target];

    targets[target] = {
      deps:    process_dependencies(target, spec.deps, configuration.deps),
      include: merge_arrays(spec.include, configuration.include),
      libs:    merge_arrays(spec.libs, configuration.libs)
    };
  }

  // Register the project.
  this._projects[configuration.name] = {
    path: configuration.path,
    targets: targets
  };
};

DepsManager.prototype.resolveTasks = function resolveTasks(name, target) {
  var tasks = this._depthFirstSearch({
    name:   name,
    target: target
  });
  tasks.pop();
  return tasks.map(function(task) {
    return task.target + ":" + task.name;
  });
};
