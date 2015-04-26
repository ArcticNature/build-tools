var Component = require("./component");
var verify    = require("../utils/verify");


/**
 * @class Components
 * Manages a group of components and their dependencies.
 */
var Components = module.exports = function Components() {
  this._components = {};
};

/**
 * Finds all the components the given component depends on.
 * @param {!String} component_name The component to find dependencies for.
 * @param {!String} target         The target to check.
 * @param {!Object} known_dependencies Object to store the set of known
 *                                     components and dependencies.
 */
Components.prototype._findComponentDeps = function _findComponentDeps(
    component_name, target, known_dependencies
) {
  if (component_name in known_dependencies) {
    // Already have (or already computing) the list for this component.
    return;
  }

  var _this = this;
  var component = this._components[component_name];
  known_dependencies[component_name] = {};

  // Find immediate dependencies.
  var deps = component.dependencies(target);
  deps.forEach(function(dep) {
    // Check if dependency exists.
    if (!_this.has(dep.name)) {
      throw Error(
          "Component '" + component_name + "' needs missing dependency '"
          + dep.name + "'"
      );
    }
    if (!_this._components[dep.name].hasTarget(dep.target)) {
      throw Error(
          "Component '" + component_name + "' needs missing target '" +
          dep.target + "' for dependency '" + dep.name + "'"
      );
    }

    // Resolve its dependencies.
    _this._findComponentDeps(dep.name, dep.target, known_dependencies);

    // Merge found dependencies into the current component set.
    // If it is found in the set to merge abort the process.
    var found_deps = [dep.name];
    found_deps.push.apply(
        found_deps, Object.keys(known_dependencies[dep.name])
    );
    found_deps.forEach(function(found_dep) {
      if (found_dep === component_name) {
        throw Error(
            "Detected mutual dependency between '" +
            component_name + "' and '" + dep.name + "'"
        );
      }
      known_dependencies[component_name][found_dep] = true;
    });
  });
};

/**
 * Adds a Component instnace to the group.
 * @param {!Component} component The Component instance to add.
 */
Components.prototype.add = function add(component) {
  if (!component) {
    throw Error("Need a component to add");
  }
  if (!(component instanceof Component)) {
    throw Error("Can only add Component instances");
  }

  var name = component.name();

  if (this.has(name)) {
    throw Error("Component '" + name + "' is already known");
  }

  this._components[component.name()] = component;
};

/**
 * Checks if a named component is in the group.
 * @param {!String} name The name of the component to check.
 * @returns {!Boolean} true if the component is in the group.
 */
Components.prototype.has = function has(name) {
  verify.notEmptyString(name, "Need a component name to check for");
  return name in this._components;
};

/**
 * Processes dependencies for the requested target.
 * @param {!String} name   The component to resolve.
 * @param {!String} target The target to resolve.
 * @param {?Object} processed_components Set of visited components.
 * @returns {!Array.<Component>}
 */
Components.prototype.resolve = function resolve(
    name, target, processed_components
) {
  verify.notEmptyString(name, "The component name must be a string");
  verify.notEmptyString(target, "The target must be a string");
  verify.notNullObjectIfDefined(
      processed_components, "'processed_components' should be a set"
  );

  if (!this.has(name)) {
    throw Error("Undefined dependent component '" + name + "'");
  }

  var _this = this;
  var components = [];
  processed_components = processed_components || {};

  // Recoursivly process dependencies with a breadth first search.
  var deps = this._components[name].dependencies(target);
  deps.forEach(function(dep) {
    if (dep.name in processed_components) {
      if (dep.target !== processed_components[dep.name]) {
        throw Error(
            "Ambiguous dependency for component '" + dep.name + "' " +
            "Found targets '" + processed_components[dep.name] + "' and '" +
            deps.target + "' but only one is allowed"
        );
      }
      return;
    }
    processed_components[dep.name] = dep.target;

    components.push.apply(
        components, _this.resolve(dep.name, dep.target, processed_components)
    );
  });

  // Now add the current component.
  components.push(this._components[name]);
  return components;
};

/**
 * Verifies that no cyclic dependencies are present and that all required
 * components and targets are configured.
 * @param {!String} target The target to check for validity.
 */
Components.prototype.verifyTarget = function verifyTarget(target) {
  verify.notEmptyString(target, "The target to verify must be a string");

  var _this = this;
  var component_names = Object.keys(this._components).sort();
  var known_components = {};

  component_names.forEach(function(component_name) {
    _this._findComponentDeps(component_name, target, known_components);
  });
};
