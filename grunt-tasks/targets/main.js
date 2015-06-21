/**
 * Debug, Release and Test target grunt tasks.
 * Processes debug|release|test and debug|release|test:component requests.
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
    var target   = this.name;
    var register = grunt.config.get("get-components")(target);

    var components = null;
    if (component) {
      components = register.resolve(component, target);
    } else {
      components = register.all(target, grunt);
    }

    grunt.task.run("hooks:pre-compile:" + target);
    components.forEach(function(component) {
      var instance = component.instance;
      instance.handleTarget(target, register);
      grunt.log.verbose.ok(
          "Configured " + target + " target for component '" +
          instance.name() + "'."
      );
    });
  };

  grunt.registerTask("debug",   "Runs tasks for debug mode.",   run_task);
  grunt.registerTask("release", "Runs tasks for release mode.", run_task);
  grunt.registerTask("test",    "Runs tasks for test mode.",    run_task);
};
