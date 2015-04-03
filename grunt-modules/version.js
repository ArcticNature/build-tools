var path = require("path");


var configure_target = function configure_target(grunt_module, config, target) {
  grunt_module.configure("shell", "version." + target, {
    command: (
        "lua " + config.path + "/build-tools/configure/configure.lua "     +
        config.path + "/include/version/compile-time-options.template.h "  +
        config.path + "/include/version/compile-time-options.h "           +
        target
    )
  });
};

module.exports = function(grunt_module, deps) {
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");
  var config = deps.getProjectMetadata("version");

  grunt_module.configure("clean", "version", [
    config.path + "/include/version/compile-time-options.h",
    config.path + "/include/version/snow-fox.h"
  ]);

  grunt_module.configure("shell", "version.make-version", {
    command: config.path + "/build-tools/make-version"
  });

  grunt_module.configure("cpplint", "version", {
    options: {
      filter: [
        "-runtime/indentation_namespace"
      ],
      root: path.normalize(config.path + "/include")
    },
    src: [config.path + "/include/**/*.h"]
  });

  configure_target(grunt_module, config, "debug");
  configure_target(grunt_module, config, "release");
  configure_target(grunt_module, config, "test");

  grunt_module.alias("version", "release:version");
  grunt_module.alias("debug:version",   [
    "shell:version.make-version",
    "shell:version.debug"
  ]);
  grunt_module.alias("release:version", [
    "shell:version.make-version",
    "shell:version.release"
  ]);
  grunt_module.alias("test:version", [
    "shell:version.make-version",
    "shell:version.test"
  ]);
  grunt_module.alias("jenkins:version", [
    "test:version",
    "cpplint:version"
  ]);
};
