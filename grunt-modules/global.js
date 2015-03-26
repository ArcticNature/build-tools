module.exports = function(grunt_module) {
  // Request modules.
  grunt_module.loadNpmTasks("grunt-contrib-clean");

  // Define aliases.
  grunt_module.alias("clean:all", "clean:*");
  grunt_module.alias("default", "release");
};
