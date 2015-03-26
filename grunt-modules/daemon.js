module.exports = function(grunt_module) {
  // Short-hand for shell tasks.
  var daemon_shell = function daemon_shell(name, command) {
    grunt_module.configure("shell", name, {
      command: command,
      options: { execOptions: { cwd: "snow-fox-daemon/" } }
    });
  };


  // Request modules.
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");


  // Generic tasks.
  daemon_shell("daemon", function(configuration) {
    configuration = configuration || "Release";
    return "make CONF=" + configuration;
  });


  // Clean tasks.
  grunt_module.configure("clean", "daemon.build", "snow-fox-daemon/build");
  grunt_module.configure("clean", "daemon.dist", "snow-fox-daemon/dist");
  grunt_module.configure("clean", "daemon.jenkins", [
    "snow-fox-daemon/coverage.xml", "snow-fox-daemon/test-results.xml"
  ]);

  grunt_module.aliasMore("clean:build", "clean:daemon.build");
  grunt_module.aliasMore("clean:dist", "clean:daemon.dist");
  grunt_module.alias("clean:daemon", [
    "clean:daemon.build", "clean:daemon.dist", "clean:daemon.jenkins"
  ]);


  // Debug aliases.
  grunt_module.aliasMore("debug", "debug:daemon");
  grunt_module.alias("debug:daemon", "shell:daemon:Debug");


  // Jenkins aliases.
  daemon_shell(
      "daemon.jenkins.test",
      "dist/Test/test --gtest_output='xml:test-results.xml'"
  );
  daemon_shell("daemon.jenkins.coverage", (
      "../build-tools/gcovr --xml " +
      "--object-directory build/Test/GNU-Linux-x86/src " +
      "--root . --exclude='.*tests.*' > coverage.xml"
  ));

  grunt_module.aliasMore("jenkins", "jenkins:daemon");
  grunt_module.alias("jenkins:daemon", [
    "clean:daemon.jenkins", "shell:daemon:Test", "shell:daemon.jenkins.test",
    "shell:daemon.jenkins.coverge"
  ]);


  // Release aliases.
  grunt_module.aliasMore("release", "release:daemon");
  grunt_module.alias("release:daemon", "shell:daemon:Release");


  // Test aliases.
  daemon_shell("daemon.test", "dist/Test/test");
  grunt_module.aliasMore("test", "test:daemon");
  grunt_module.alias("test:daemon", ["shell:daemon:Test", "shell:daemon.test"]);
};
