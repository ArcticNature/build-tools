module.exports = function(grunt) {
  var verify = require("../../utils/verify");

  var sync_component_list = function sync_component_list(target) {
    verify.notEmptyString(target, "A valid target name must be specified");

    // Load the components collection.
    grunt.config.requires("get-components");
    var components = grunt.config("get-components")();

    // Load enabled/disabled components.
    // Ignore unkown components in that list.

    // List all components.
    var content = "";
    components.list().forEach(function(name) {
      var component = components.get(name);
      var tag = component.enabled() ? "enabled" : "disabled";
      content += name + " = " + tag + "\n";
    });

    // Write back list with enabled/disabled value.
    if (grunt.option("no-write")) {
      grunt.log.writeln(content);
    }
    grunt.file.write("build-tools/com-config/" + target, content);
  };

  grunt.registerTask(
      "sync-component-list",
      "Updates the list of enabled components for the given target.",
      sync_component_list
  );
};
