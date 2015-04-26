/**
 * Clear target grunt task.
 * Processes clear and clear:component requests.
 * 
 * The task can be called in three ways:
 *   * clear                  - Will clear all targets of all known components.
 *   * clear:component        - Will clear all targets of a component.
 *   * clear:component:target - Will clear a target of a component.
 * 
 * Note that the task is not call clean to avoid clashing with the
 * grunt-contrib-clean task.
 */


module.exports = function(grunt) {
  /**
   * Clear all components.
   * @param {!Components} components The components collection to clear.
   */
  var clear_all = function clear_all(components) {
    var all_components = components.list();
    all_components.forEach(function(component) {
      clear_component(components.get(component));
    });
  };

  /**
   * Clear a component.
   * @param {!Component} component The component to clear.
   */
  var clear_component = function clear_component(component) {
    var targets = component.targets();
    targets.forEach(function(target) {
      clear_target(component, target);
    });
  };

  /**
   * Clear a target of a component.
   * @param {!Component} component The component to clear.
   * @param {!String}    target    The target to clear.
   */
  var clear_target = function clear_target(component, target) {
    if (!component.hasTarget(target)) {
      throw new Error(
          "Missing target '" + target + "' for component '" +
          component.name() + "'"
      );
    }

    var name = component.name() + "\\." + target;
    var path = component.getCleanPath(target);
    grunt.config("clean." + name, path);
  };

  // Register the task with grunt.
  grunt.registerTask(
      "clear", "Clears output of buils of one or more components.",
      function(component_name, target) {
    // Load the components collection.
    grunt.config.requires("get-components");
    var components = grunt.config.get("get-components")();

    if (component_name) {
      var component = components.get(component_name);
      if (target) {
        clear_target(component, target);
      } else {
        clear_component(component);
      }

    } else {
      clear_all(components);
    }
  });
};
