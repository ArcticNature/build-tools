module.exports = function(grunt_module) {
  // Request modules.
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");

  // Configure tasks:
  //  clean
  grunt_module.configure("clean", "daemon.build", "snow-fox-daemon/build");
  grunt_module.configure("clean", "daemon.dist", "snow-fox-daemon/dist");

  //  shell
  grunt_module.configure("shell", "daemon", {
    command: function(configuration) {
      configuration = configuration || "Release";
      return "make --directory=snow-fox-daemon CONF=" + configuration;
    }
  });
  grunt_module.configure("shell", "test.daemon", {
    command: "dist/Test/test",
    options: { execOptions: { cwd: "snow-fox-daemon/" } }
  });

  // Clean aliases.
  grunt_module.aliasMore("clean:build", "clean:daemon.build");
  grunt_module.aliasMore("clean:dist", "clean:daemon.dist");
  grunt_module.alias("clean:daemon", [
    "clean:daemon.build", "clean:daemon.dist"
  ]);

  // Debug aliases.
  grunt_module.aliasMore("debug", "debug:daemon");
  grunt_module.alias("debug:daemon", "shell:daemon:Debug");

  // Release aliases.
  grunt_module.aliasMore("release", "release:daemon");
  grunt_module.alias("release:daemon", "shell:daemon:Release");

  // Test aliases.
  grunt_module.aliasMore("test", "test:daemon");
  grunt_module.alias("test:daemon", ["shell:daemon:Test", "shell:test.daemon"]);
};
