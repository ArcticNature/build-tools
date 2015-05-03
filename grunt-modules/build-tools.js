module.exports = function(grunt_module) {
  var SubProcess = require("../utils/subprocess");

  grunt_module.configure("mochaTest", "build-tools", {
    src: "build-tools/tests/**/test_*.js",
    options: {
      ignoreLeaks: false,
      ui: "tdd"
    }
  });

  grunt_module.registerTask(
      "plot-deps", "Plots the dependency graph", function(target, format) {
    if (!target) {
      throw new Error(
          "plot-deps task needs a target to process. Try plot-deps:release"
      );
    }

    var grunt = grunt_module.getGrunt();
    grunt.config.requires("get-components");

    var components = grunt.config.get("get-components")();
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
  });

  grunt_module.loadNpmTasks("grunt-mocha-test");
  grunt_module.alias("test-build-tools", ["mochaTest:build-tools"]);
};
