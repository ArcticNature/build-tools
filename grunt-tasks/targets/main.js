/**
 * Debug, Release and Test target grunt tasks.
 * Processes clear and clear:component requests.
 * 
 * These tasks can be called in two ways:
 *   * debug|release|test           - Will run the target for all components.
 *   * debug|release|test:component - Will run the target for a component and
 *                                    its dependencies.
 */
module.exports = function(grunt) {
  /**
   * Determines the components to run tasks for and schedules them for the
   * correct target.
   * @param {?String} component Optionally process this component and its
   *                            dependencies only.
   */
  var run_task = function run_task(component) {
    // Load the components collection.
    grunt.config.requires("get-components");
    var register = grunt.config.get("get-components")();
    var target   = this.name.substring(4);

    var components = null;
    if (component) {
      components = register.resolve(component, target);
    } else {
      components = register.all(target, grunt);
    }

    components.forEach(function(component) {
      component.handleTarget(target);
      grunt.log.verbose.ok(
          "Configured target '" + target + "' for component '" +
          component.name() + "'."
      );
    });
  };

  grunt.registerTask("new-debug",   "Runs tasks for debug mode.",   run_task);
  grunt.registerTask("new-release", "Runs tasks for release mode.", run_task);
  grunt.registerTask("new-test",    "Runs tasks for test mode.",    run_task);
};
