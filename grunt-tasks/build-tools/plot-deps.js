module.exports = function(grunt) {
  var SubProcess = require("../../utils/subprocess");
  var plot_deps  = function plot_deps(target, format) {
    if (!target) {
      throw new Error(
          "plot-deps task needs a target to process. Try plot-deps:release"
      );
    }
    grunt.config.requires("get-components");

    var components = grunt.config.get("get-components")(target);
    var graph = components.plot(target);

    grunt.file.write("out/deps/" + target + ".dot", graph);
    if (grunt.option("no-write")) {
      return;
    }

    // Trun the task async and convert .dot file to format.
    var done = this.async();
    format   = format || "svg";

    var subprocess = new SubProcess(grunt.log, {
      cmd:  "dot",
      args: [
        "-T" + format,
        "-o", "out/deps/" + target + "." + format,
        "out/deps/" + target + ".dot"
      ]
    });

    subprocess.spawn().then(function() {
      done();

    }).fail(function(code) {
      done(new Error(code));
    });
  };

  grunt.registerTask("plot-deps", "Plots the dependency graph", plot_deps);
};
