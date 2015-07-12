module.exports = function(grunt) {
  var explain = function explain(target) {
    if (!target) {
      throw new Error(
          "explain-build task needs a target to process. " +
          "Try explain-build:release"
      );
    }
    grunt.config.requires("get-components");

    var register   = grunt.config.get("get-components")(target);
    var components = register.all(target, grunt);

    components.forEach(function(component) {
      grunt.log.writeln(component.instance.name());
    });
  };

  grunt.registerTask(
      "explain-build", "Shows the order in which components will be built.",
      explain
  );
};
