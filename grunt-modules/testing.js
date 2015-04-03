var task_gen = require("../utils/task-gen");


module.exports = function(grunt_module, deps) {
  var opts = deps.getProjectMetadata("testing");

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
    debug: opts.name + ".debug"
  };

  // Request modules.
  grunt_module.loadTasks("build-tools/grunt-tasks");
  grunt_module.loadTasks("build-tools/grunt-tasks/c++");
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");

  // Configure tasks.
  task_gen.configure_clean(grunt_module, names, opts);
  task_gen.configure_cxx_target("debug", grunt_module, names.debug, opts, deps);
  task_gen.configure_jenkins(grunt_module, names, opts, deps, true);
};
