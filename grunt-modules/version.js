var configure_target = function configure_target(grunt_module, target) {
  grunt_module.configure("shell", "version." + target, {
    command: (
        "lua snow-fox-version/build-tools/configure/configure.lua "         +
        "snow-fox-version/include/version/compile-time-options.template.h " +
        "snow-fox-version/include/version/compile-time-options.h "          +
        target
    )
  });
};

module.exports = function(grunt_module) {
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");

  grunt_module.configure("clean", "version", [
    "snow-fox-version/include/version/compile-time-options.h",
    "snow-fox-version/include/version/snow-fox.h"
  ]);

  grunt_module.configure("shell", "version.make-version", {
    command: "snow-fox-version/build-tools/make-version"
  });

  grunt_module.configure("cpplint", "version", {
    options: {
      filter: [
        "-runtime/indentation_namespace"
      ],
      root: "snow-fox-version/include"
    },
    src: ["snow-fox-version/include/**/*.h"]
  });

  configure_target(grunt_module, "debug");
  configure_target(grunt_module, "release");
  configure_target(grunt_module, "test");

  grunt_module.alias("version", "release:version");
  grunt_module.alias("debug:version",   "shell:version.debug");
  grunt_module.alias("release:version", "shell:version.release");
  grunt_module.alias("jenkins:version", [
    "shell:version.make-version",
    "shell:version.test",
    "cpplint:version"
  ]);
};
