/**
 * Populates a GrHunter module with tasks related to a C++ project.
 * In this description, {name} refers to the name of the module being
 * configured.
 * 
 * The following tasks are added:
 *   * {name} Build a release version of the component.
 *   * debug.{name}    Build debug version of the component.
 *   * release.{name}  Build release version of the component.
 *   * jenkins.{name}  Run tests and reports for the component.
 *
 *   * clean:{name}          Run all clean tasks for the component.
 *   * clean:{name}.build    Clean object files for the component.
 *   * clean:{name}.dist     Clean target files for the component.
 *   * clean:{name}.jenkins  Clean metrics-related reports.
 * 
 * The following tasks are extended:
 *   * debug    Run all debug tasks for all components.
 *   * clean    Run all clean tasks for all components.
 *   * jenkins  Run all tests and reports for all components.
 *
 *   * clean.build    Run debug clean task for all components.
 *   * clean.dist     Run dist clean task for all components.
 *   * clean.jenkins  Run jenkin clean task for all components.
 */
var path = require("path");
var task_gen = require("./task-gen");


var CppModuleGenerator = module.exports = function CppModuleGenerator(
    grunt_module, deps, name
) {
  var opts = deps.getProjectMetadata(name);

  // Ensure required options are set.
  if (!opts.name) {
    throw new Error("Required name of the component being configured.");
  }
  if (!opts.path) {
    throw new Error("Required path to code root in the 'path' attribute.");
  }

  // Build all names that will me needed during configuration.
  var names = {
    build: opts.name + ".build",
    dist:  opts.name + ".dist",
    jnkns: opts.name + ".jenkins",

    debug:   opts.name + ".debug",
    release: opts.name + ".release",
    test:    opts.name + ".test"
  };

  // Configure tasks.
  task_gen.configure_clean(grunt_module, names, opts);
  task_gen.configure_cxx_target("debug", grunt_module, names.debug, opts, deps);
  task_gen.configure_cxx_target(
      "release", grunt_module, names.release, opts, deps
  );
  task_gen.configure_test(grunt_module, names, opts, deps);
  task_gen.configure_jenkins(grunt_module, names, opts, deps);

  // Short-hand for release task.
  grunt_module.alias(opts.name, "release." + opts.name);
};
