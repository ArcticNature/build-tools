/**
 * Analyse target grunt tasks.
 * Processes analyse and analyse:component requests.
 * 
 * This task can be called in two ways:
 *   * analyse           - Will run the analysis for all components.
 *   * analyse:component - Will run the analysis for a component only.
 */
module.exports = function(grunt) {
  /**
   * Determines the components to run tasks for and schedules them.
   * @param {?String} component Optionally process this component and its
   *                            dependencies only.
   */
  var run_task = function run_task(component) {
    // Load the components collection.
    grunt.config.requires("get-components");
    var register = grunt.config.get("get-components")();

    var analyse_all = true;
    var components  = null;

    if (component) {
      components  = register.resolve(component, "test");
      analyse_all = false;

    } else {
      components = register.all("test", grunt);
    }

    components.forEach(function(component) {
      var instance = component.instance;
      instance.handleTarget(component.target, register);
      grunt.log.verbose.ok(
          "Configured test target for component '" + instance.name() + "'."
      );

      if (analyse_all) {
        instance.handleAnalysis();
        grunt.log.verbose.ok(
          "Configured analysis for component '" + instance.name() + "'."
        );
      }
    });

    if (!analyse_all) {
      var component = components.pop();
      var instance  = component.instance;
      instance.handleAnalysis();
      grunt.log.verbose.ok(
        "Configured analysis for component '" + instance.name() + "'."
      );
    }
  };

  grunt.registerTask("analyse", "Runs component analysis.", run_task);
};
