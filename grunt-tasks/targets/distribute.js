var DISTRIBUTION_FILE = "distribution.json";
var DistributionBuilder = require("../../distribute");

/**
 * Distribution build grunt tasks.
 * Processes distribute and distribute:package requests.
 * 
 * This task can be called in two ways:
 *   * distribute         - Will build the distribution for all packages.
 *   * distribute:pakcage - Will build the distribution for a package.
 */
module.exports = function(grunt) {
  /**
   * Build distribution packages according to distribution.json
   * @param {?String} package Optionally, build only this package.
   */
  var run_task = function run_task(package) {
    // Look for configuration.
    if (!grunt.file.exists(DISTRIBUTION_FILE)) {
      grunt.log.error(
          "Need a " + DISTRIBUTION_FILE + " file to build packages."
      );
      return false;
    }

    // Split it into packages and options.
    var packages = grunt.file.readJSON(DISTRIBUTION_FILE);
    var options  = packages.options || {};
    delete packages.options;

    // Check that packages are defined.
    if (Object.keys(packages).length === 0) {
      grunt.log.error("No packages to build were found.");
      return false;
    }

    if (package && !packages.hasOwnProperty(package)) {
      grunt.log.error("Package '" + package + "' was not found.");
      return false;
    }

    // Trigger package build.
    grunt.config.requires("get-components");
    var register = grunt.config.get("get-components")("release");
    var builder  = new DistributionBuilder(register, packages, options, grunt);
    var promise  = null;

    if (package) {
      promise = builder.build(package);
    } else {
      promise = builder.all();
    }

    var done = this.async();
    promise.then(done).catch(done);
  };

  grunt.registerTask("distribute", "Builds distribution packages.", run_task);
};
