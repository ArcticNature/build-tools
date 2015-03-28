module.exports = function(grunt) {
  var SubProcess = require("../utils/subprocess");
  var DEFAULT_OPTIONS = {
    configuration: null,
    cwd: null
  };

  grunt.registerMultiTask("make", "GNU make runner.", function() {
    // Prepare task and options.
    var options = this.options(DEFAULT_OPTIONS, this.data);

    // Assert conconfiguration is provided.
    if (!options.configuration) {
      throw new Error("Make tasks need a configuration.");
    }

    // Run make.
    var done = this.async();
    var make = new SubProcess({
      args: ["CONF=" + options.configuration],
      cmd:  "make",
      cwd:  options.cwd
    });

    // Resolve task.
    make.spawn().then(function() {
      done();

    }).fail(function(code) {
      done(new Error("Make failed with code " + code));
    });
  });
};
