module.exports = function(grunt) {
  var SubProcess = require("../../../utils/subprocess");
  var DEFAULT_OPTIONS = {
    cwd: null,
    exclude: null,
    filter:  null,
    gcovr:   "./gcovr",
    root:    ".",
    save_to: "coverage.xml",

    // Required options.
    objects: null
  };

  grunt.registerMultiTask("gcovr", "Compute coverage report.", function() {
    // Prepare task and options.
    var options = this.options(DEFAULT_OPTIONS, this.data);

    // Assert object directory is provided.
    if (!options.objects) {
      throw new Error("GCovr tasks need an objects directory.");
    }

    // Run make.
    var args = [
      "--xml", "--root=" + options.root,
      "--object-directory=" + options.objects
    ];
    if (options.exclude) {
      args.push("--exclude=" + options.exclude);
    }
    if (options.filter) {
      args.push("--filter=" + options.filter);
    }

    var done  = this.async();
    var gcovr = new SubProcess(grunt.log, {
      args:   args,
      cmd:    options.gcovr,
      cwd:    options.cwd,
      stdout: options.save_to
    });

    // Resolve task.
    gcovr.spawn().then(function() {
      done();

    }).fail(function(code) {
      done(new Error("GCovr failed with code " + code));
    });
  });
};
