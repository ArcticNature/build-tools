module.exports = function(grunt) {
  var graph = require("../../graph");
  var SubProcess = require("../../utils/subprocess");

  var plot_deps  = function plot_deps(target, component) {
    if (!target) {
      throw new Error(
          "plot-deps task needs a target to process. Try plot-deps:release"
      );
    }
    grunt.config.requires("get-components");
    var components = grunt.config.get("get-components")(target);
    var name = target;
    var plot = null;

    // Plot only the requested component.
    if (component) {
      name = name + "-" + component;
      plot = components.get(component).graph(components, target);
  
    // Or all of the known ones.
    } else {
      var all = components.all(target, grunt);
      var graphs = all.map(function(component) {
        return component.instance.graph(components, component.target);
      });
      plot = graph.merge(graphs);
    }

    if (grunt.option("indirect")) {
      plot = graph.indirect(plot);
    }

    var raw_data = graph.dot.convert(plot);
    grunt.file.write("out/deps/" + name + ".dot", raw_data);

    if (grunt.option("no-write")) {
      return;
    }

    // Trun the task async and convert .dot file to format.
    var done   = this.async();
    var format = grunt.option("format") || "svg";

    var subprocess = new SubProcess(grunt.log, {
      cmd:  "dot",
      args: [
        "-T" + format,
        "-o", "out/deps/" + name + "." + format,
        "out/deps/" + name + ".dot"
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
