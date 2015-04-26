var verify = require("../utils/verify");


/**
 * @class Component
 * Represents a component to be built.
 * 
 * @param {!Object} configuration The configuration of the component.
 */
var Component = module.exports = function Component(configuration) {
  // Verify configuration.
  verify.notNullObject(configuration, "Missing component configuration");
  verify.notEmptyString(configuration.name, "Missing component name");
  verify.notNullObjectIfDefined(
      configuration.targets,
      "If defined, the target property must be an object."
  );

  // Store it in the new instance.
  this._name = configuration.name;
  this._targets = {};

  // Process targets.
  if (configuration.targets) {
    this._process_targets(configuration);
  }
};


/**
 * Parses a dependency name for a target.
 * @param {!String} name   The dependency name to parse.
 * @param {!String} target The target that the name is resolved for.
 * @returns {!Object} A {name: !String, target: !String} object.
 */
Component.parseDependencyName = function parseDependencyName(name, target) {
  verify.notEmptyString(name, "The dependency name must be a string");
  verify.notEmptyString(
      target, "The name of the current target must be a string"
  );
  var parts = name.split(".");

  // Target missing from name.
  if (parts.length === 1) {
    return {
      name: name,
      target: target
    };
  }

  // Both target and name are specified.
  if (parts.length === 2) {
    return {
      name: parts[1],
      target: parts[0]
    };
  }

  throw Error("Cannot parse malformed dependency '" + name + "'");
};

/**
 * Checks the given list of dependencies for conflicts and duplicates.
 * @param {!Array} dependencies
 * @returns {!Array}
 */
Component.checkDependenciesList = function checkDependenciesList(
    dependencies
) {
  verify.array(dependencies, "An array of dependencies is required");

  // Check for ambiguous dependencies.
  var components = {};
  dependencies.forEach(function(dep) {
    if (dep.name in components && components[dep.name] !== dep.target) {
      throw Error("Ambiguous dependency for component '" + dep.name + "'");
    }
    components[dep.name] = dep.target;
  });

  // Rebuild result array.
  var added  = {};
  return dependencies.filter(function(dep) {
    var ignore = dep.name in added;
    added[dep.name] = true;
    return !ignore;
  });
};


/**
 * Processes a component configuration to extract targets information.
 * @param {!Object} config The configuration to process.
 */
Component.prototype._process_targets = function _process_targets(config) {
  var targets = Object.keys(config.targets);
  var nameParser = function(target) {
    return function(name) {
      return Component.parseDependencyName(name, target);
    };
  };

  for (var idx=0; idx < targets.length; idx++) {
    var name   = targets[idx];
    var target = config.targets[name];

    // Verify target structure.
    verify.optionalArray(
        target.deps,
        "If defined, the deps property of target '" + name +
        "' must be an array"
    );

    // Process dependneces.
    var global_deps = config.deps || [];
    var target_deps = target.deps || [];
    var deps = [];
    deps.push.apply(deps, global_deps);
    deps.push.apply(deps, target_deps);
    deps = deps.map(nameParser(name));
    deps = Component.checkDependenciesList(deps);

    // Build result.
    this._targets[name] = {
      deps: deps
    };
  }
};

/**
 * Returns the list of dependencies for a target.
 * @param {!Strng} name The target to look for.
 * @returns {!Array} List of objects describing targets.
 */
Component.prototype.dependencies = function dependencies(name) {
  verify.notEmptyString(name, "Target name must be a string");
  if (!(name in this._targets)) {
    throw Error("Missing target '" + name + "' for '" + this._name + "'");
  }

  var target = this._targets[name];
  return target.deps;
};

/**
 * Checks if a target is available.
 * @param {!String} target The target to check
 * @returns {!Boolean} True if the target is configured.
 */
Component.prototype.hasTarget = function hasTarget(target) {
  verify.notEmptyString(target, "Target to check for must be a string");
  return target in this._targets;
};

/**
 * @returns {!String} The name of the component.
 */
Component.prototype.name = function name() {
  return this._name;
};

/**
 * @returns {!Array} The list of targets defined for the component.
 */
Component.prototype.targets = function targets() {
  return Object.keys(this._targets);
};
