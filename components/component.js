var verify = require("../utils/verify");
var KNOWN_MODULE_TYPES = {
  "core": true,
  "core-extension": true,
  "extension": true
};


/**
 * @class Component
 * Represents a component to be built.
 * 
 * @param {!Object} configuration The configuration of the component.
 *  @property {!Object} grunt Instance of grunt to use in the component.
 *  @property {!String} name  The name of the component.
 *  @property {?String} colour  The colour of the component.
 * 
 *  @property {?Object} targets Target definition object.
 *    @property {?Array.<String>} deps List of project dependencies.
 * 
 *  @property {?String} module-type Type of component being defined:
 *    * core: module is always enabled and has no init function [default].
 *    * core-extension: module is always enabled and has an init function.
 *    * extension: module has an init function and can be disabled.
 */
var Component = module.exports = function Component(configuration) {
  // Verify configuration.
  verify.notNullObject(configuration, "Invalid component configuration");
  verify.notNullObject(configuration.grunt, "Grunt instance not valid");
  verify.notEmptyString(configuration.name, "Missing component name");
  verify.notNullObjectIfDefined(
      configuration.targets,
      "If defined, the target property must be an object."
  );
  verify.optionalColour(
      configuration.colour,
      "If defined, the colour property must be an hex colour prefixed by an #."
  );
  verify.optionalNotEmptyString(
      configuration["module-type"],
      "If defined, the module-type property must be a string."
  );
  verify.optionalArray(
      configuration.inject,
      "Invalid injection list. Array of string required.",
      verify.notEmptyString
  );

  // Store it in the new instance.
  this._colour = configuration.colour;
  this._grunt  = configuration.grunt;
  this._inject = configuration.inject || [];
  this._name   = configuration.name;
  this._module_type = configuration["module-type"] || "core";
  this._enabled = true;
  this._targets = {};

  // Validate mode.
  if (!KNOWN_MODULE_TYPES[this._module_type]) {
    throw new Error("Unrecognised module type '" + this._module_type + "'");
  }

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

  throw new Error("Cannot parse malformed dependency '" + name + "'");
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
      throw new Error("Ambiguous dependency for component '" + dep.name + "'");
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
    verify.notNullObject(target, "Target definitions must be objects.");
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
 * Adds a dependency to all the targets of the component.
 * @param {!String} name The name of the dependency to add.
 */
Component.prototype.addDependency = function addDependency(name) {
  var _this   = this;
  var targets = Object.keys(this._targets);

  targets.forEach(function(target) {
    var deps = [];
    var parsed_name = Component.parseDependencyName(name, target);

    deps.push.apply(deps, _this._targets[target].deps);
    deps.push(parsed_name);

    deps = Component.checkDependenciesList(deps);
    _this._targets[target].deps = deps;
  });
};

/** @returns {bool} True if the component can be disabled. */
Component.prototype.canDisable = function canDisable() {
  return this._module_type === "extension";
};

/** @returns {!String} The colour of the component. */
Component.prototype.colour = function colour() {
  if (!this._colour) {
    this._colour = "#" + Math.floor(Math.random() * 16777215).toString(16);
  }
  return this._colour;
};

/**
 * Returns the list of dependencies for a target.
 * @param {!Strng} name The target to look for.
 * @returns {!Array} List of objects describing targets.
 */
Component.prototype.dependencies = function dependencies(name) {
  verify.notEmptyString(name, "Target name must be a string");
  if (!(name in this._targets)) {
    throw new Error("Missing target '" + name + "' for '" + this._name + "'");
  }

  var target = this._targets[name];
  return target.deps;
};

/**
 * Disables an optional component.
 * Calls to this method have no effect if the component cannot be diasabled.
 * @returns {!Boolean} true if the component was disabled by this call.
 */
Component.prototype.disable = function disable() {
  var enabled = this._enabled;
  this._enabled = false;
  return enabled;
};

/**
 * @returns {!Boolean} true if the component is currently enabled.
 */
Component.prototype.enabled = function enabled() {
  return (
      this._module_type === "core" ||
      this._module_type === "core-extension" ||
      this._enabled
  );
};

/**
 * Returns the path to run the clean task against
 * @param {!String} target The target to get the path for.
 * @returns {!String|!Array.<!String>} Path or paths to clear.
 */
Component.prototype.getCleanPath = function getCleanPath(target) {
  throw new Error("Method not implemented");
};

/**
 * Returns a list of C/C++ header files exposed by this component.
 * @param {!String} target The target to get the headers for.
 * @returns {!Array.<!String>} Headers file exposed.
 */
Component.prototype.getCppHeaders = function getCppHeaders(target) {
  return [];
};

/**
 * Returns a list of C/C++ dynamic libraries needed by this component.
 * @param {!String} target The target to get the dynamic libraries for.
 * @returns {!Array.<!String>} Static libraries exposed.
 */
Component.prototype.getDynamicLibs = function getDynamicLibs(target) {
  return [];
};

/** @returns {!String} The type of component. */
Component.prototype.getModuleType = function getModuleType() {
  return this._module_type;
};

/**
 * Returns a list of partial grunt file mappings.
 * 
 * These mappings are used by NodeJS components to copy the needed files
 * into their destination directoryes.
 * As such, the mappings will have a source but should not have a dest
 * attribute, which will be set by the component that includes this.
 * 
 * @param {!String} target The target to get the deps for.
 * @returns {!Array} An array of grunt file mappings without a dest attribute.
 */
Component.prototype.getNodeJsDependencies = function getNodeJsDependencies(
    target
) {
  return [];
};

/**
 * Returns the path to the output to the item build by this component.
 * 
 * @param {!String} target The target to get the output path for.
 * @returns {!String|!Object}
 *     Path or to the item build by this target or object describing
 *     the files built by this target.
 *     
 *     If this method returns an object,
 *     the object has the following properties:
 *     
 *       * cwd: the `cwd` option to `grunt.file.copy`.
 *       * expand: the `expand` option to `grunt.file.copy`.
 *       * src: the `src` option to `grunt.file.copy`, this is mandatory.
 */
Component.prototype.getOutput = function getOutput(target) {
  throw new Error("Method not implemented");
};

/**
 * Returns a list of C/C++ static libraries exposed by this component.
 * @param {!String} target The target to get the static libraries for.
 * @returns {!Array.<!String>} Static libraries exposed.
 */
Component.prototype.getStaticLibs = function getStaticLibs(target) {
  return [];
};

/**
 * Returns a graph description for the component.
 *
 * The graph desctiption has the following format:
 *   * nodes: map from node ID to node description
 *     * label:  string describing the label.
 *     * colour: string with the colour of the node.
 *   * edges: list of directed edges mapping node ids.
 *
 * @param {!Object} components The components registry.
 * @param {!String} target     The build target to generate the graph for.
 * @returns {!Object} Direct dependencies graph for this component.
 */
Component.prototype.graph = function graph(components, target) {
  var deps  = this.dependencies(target);
  var graph = {
    nodes: {},
    edges: []
  };

  // Conver deps in components.
  deps = deps.map(function(dep) {
    return {
      instance: components.get(dep.name),
      target:   dep.target
    }
  });

  // Build the nodes map.
  graph.nodes[this.name()] = {
    colour: this.colour(),
    label:  this.name()
  };

  deps.forEach(function(dep) {
    var name = dep.instance.name();
    graph.nodes[name] = {
      colour: dep.instance.colour(),
      label:  name
    };
  });

  // Build the edges list.
  var _this = this;
  deps.forEach(function(dep) {
    graph.edges.push({
      colour: _this.colour(),
      from: dep.instance.name(),
      to:   _this.name()
    });
  });

  // Done.
  return graph;
};

/**
 * Handles the configuration and enqueuing of analysis tasks.
 * @param {!Components} components Collection of components in the system.
 */
Component.prototype.handleAnalysis = function handleAnalysis(components) {
  throw new Error("Method not implemented");
};

/**
 * Handles the configuration and enqueuing of a target.
 * @param {!String} target The target to handle.
 * @param {!Components} components Collection of components in the system.
 */
Component.prototype.handleTarget = function handleTarget(target, components) {
  throw new Error("Method not implemented");
};

/** @returns {bool} True if the component has an init function. */
Component.prototype.hasModuleInit = function hasModuleInit() {
  return (
      this._module_type === "core-extension" ||
      this._module_type === "extension"
  );
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

/** @returns {!Array.<String>} the list of components to be injected into. */
Component.prototype.listInjections = function listInjections() {
  return this._inject;
};

/** @returns {!String} The name of the component. */
Component.prototype.name = function name() {
  return this._name;
};

/** @returns {!Array} The list of targets defined for the component. */
Component.prototype.targets = function targets() {
  return Object.keys(this._targets).sort();
};
