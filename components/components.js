var Component = require("./component");
var ResolveAllComponent = require("./types/resolve-all");
var verify = require("../utils/verify");


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
    // Check if dependency exists ...
    if (!_this.has(dep.name)) {
      throw new Error(
          "Component '" + component_name + "' needs missing dependency '"
          + dep.name + "'"
      );
    }

    // ... and is enabled ...
    if (!_this._components[dep.name].enabled()) {
      throw new Error(
          "Component '" + component_name + "' depends on disabled " +
          "component '" + dep.name + "'"
      );
    }

    // ... and has the required target.
    if (!_this._components[dep.name].hasTarget(dep.target)) {
      throw new Error(
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
        throw new Error(
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
    throw new Error("Need a component to add");
  }
  if (!(component instanceof Component)) {
    throw new Error("Can only add Component instances");
  }

  var name = component.name();

  if (this.has(name)) {
    throw new Error("Component '" + name + "' is already known");
  }

  this._components[component.name()] = component;
};

/**
 * Returns a list of all components in the collection.
 * @param {!String} target The target to fetch all components for.
 * @param {!Object} grunt  The grunt instance to use.
 * @returns {!Array.<!String>} list of components in resolved order.
 */
Components.prototype.all = function all(target, grunt) {
  var _this = this;
  var names = Object.keys(this._components).sort();

  // Filter out all names where the target is not defined.
  names = names.filter(function(name) {
    return (
        _this._components[name].hasTarget(target) &&
        _this._components[name].enabled()
    );
  });

  // Create fake component that depends on all other components.
  var stub = new ResolveAllComponent(grunt, names, target);

  // Add it, call resolve on it and remove it.
  var stub_name  = stub.name();
  var components = null;
  try {
    this.add(stub);
    components = this.resolve(stub_name, target);
    delete this._components[stub_name];

  } catch (ex) {
    if (stub_name in this._components) {
      delete this._components[stub_name];
    }
    throw ex;
  }

  // Pop it form the list of returned components.
  components.pop();

  // Return the resolved list.
  return components;
};

/**
 * Returns a component from the collection.
 * @param {!String} component The component to get.
 * @returns {!Component} A Component instance.
 */
Components.prototype.get = function get(component) {
  if (component) {
    if (!this.has(component)) {
      throw new Error("Missing component '" + component + "'");
    }
  }
  return this._components[component];
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
 * Injects components into the dependency list of the component
 * that should depend on them.
 */
Components.prototype.inject = function inject() {
  var _this = this;
  var all = this.list();

  all.forEach(function(dependency_name) {
    var dependency = _this.get(dependency_name);
    if (!dependency.enabled()) {
      return;
    }

    dependency.listInjections().forEach(function(dependant_name) {
      var dependant = _this.get(dependant_name);
      dependant.addDependency(dependency_name);
    });
  });
};

/**
 * @returns {!Array.<!String>} list of components in the collection.
 */
Components.prototype.list = function list() {
  return Object.keys(this._components).sort();
};

/**
 * Processes dependencies for the requested target.
 * @param {!String} name   The component to resolve.
 * @param {!String} target The target to resolve.
 * @param {?Object} processed_components Set of visited components.
 * @returns {!Array.<!Object>} The dependency information 
 */
Components.prototype.resolve = function resolve(
    name, target, processed_components
) {
  verify.notEmptyString(name, "The component name must be a string");
  verify.notEmptyString(target, "The target must be a string");
  verify.notNullObjectIfDefined(
      processed_components, "'processed_components' should be a set"
  );

  if (!this.has(name) || !this.get(name).enabled()) {
    throw new Error("Undefined dependent component '" + name + "'");
  }

  var _this = this;
  var components = [];
  processed_components = processed_components || {};

  // Recoursivly process dependencies with a breadth first search.
  var deps = this._components[name].dependencies(target);
  deps.sort(function(left, right) {
    var lname = left.name;
    var rname = right.name;

    if (lname < rname) {
      return -1;
    } else if (lname === rname) {
      return 0;
    }
    return +1;
  });

  deps.forEach(function(dep) {
    if (dep.name in processed_components) {
      if (dep.target !== processed_components[dep.name]) {
        throw new Error(
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
  components.push({ instance: this._components[name], target: target });
  return components;
};

/**
 * @returns {!Array.<!String>} list of all targets across all components.
 */
Components.prototype.targets = function targets() {
  var _this   = this;
  var targets = {};
  var components = this.list();

  components.forEach(function(component) {
    _this._components[component].targets().forEach(function(target) {
      targets[target] = true;
    });
  });

  return Object.keys(targets);
};

/**
 * Verifies that no cyclic dependencies are present and that all required
 * components and targets are configured.
 */
Components.prototype.verify = function verify() {
  var _this = this;
  var targets = this.targets();

  targets.forEach(function(target) {
    _this.verifyTarget(target);
  });
};

/**
 * Verifies that no cyclic dependencies are present and that all required
 * components and targets are configured.
 * @param {!String} target The target to check for validity.
 */
Components.prototype.verifyTarget = function verifyTarget(target) {
  verify.notEmptyString(target, "The target to verify must be a string");

  var _this = this;
  var component_names = this.list();
  var known_components = {};

  component_names.forEach(function(component_name) {
    if (_this._components[component_name].hasTarget(target)) {
      _this._findComponentDeps(component_name, target, known_components);
    }
  });
};
