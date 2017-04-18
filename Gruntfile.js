module.exports = function(grunt) {
  var Components = require("./components");
  var GrHunter   = require("./grhunter");
  var grhunter   = new GrHunter(grunt);

  // Regiter modules to load.
  grhunter.package(grunt.file.readJSON("package.json"));
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-shell");

  grunt.loadTasks("build-tools/grunt-tasks/build-tools");
  grunt.loadTasks("build-tools/grunt-tasks/c++/compilation");
  grunt.loadTasks("build-tools/grunt-tasks/c++/tools");
  grunt.loadTasks("build-tools/grunt-tasks/generic");
  grunt.loadTasks("build-tools/grunt-tasks/protobuf");
  grunt.loadTasks("build-tools/grunt-tasks/targets");

  // Load speacial modules.
  grhunter.loadModule("./build-tools/grunt-modules/build-tools");
  grhunter.compose();

  // Lasy load components only if and when requested.
  grunt.config.set("get-components", function(target) {
    return Components.getComponents(grunt, target);
  });

  grunt.registerTask("default", "release");
};
