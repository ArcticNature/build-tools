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
  grunt_module.loadTasks("build-tools/grunt-tasks");


  // Clean tasks.
  grunt_module.configure("clean", "daemon.build", "snow-fox-daemon/build");
  grunt_module.configure("clean", "daemon.dist",  "snow-fox-daemon/dist");
  grunt_module.configure("clean", "daemon.jenkins", [
    "snow-fox-daemon/coverage.xml",
    "snow-fox-daemon/cppcheck.xml",
    "snow-fox-daemon/test-results.xml"
  ]);

  grunt_module.aliasMore("clean:build", "clean:daemon.build");
  grunt_module.aliasMore("clean:dist", "clean:daemon.dist");
  grunt_module.alias("clean:daemon", [
    "clean:daemon.build",
    "clean:daemon.dist",
    "clean:daemon.jenkins"
  ]);


  // Debug aliases.
  grunt_module.configure("fake", "daemon.debug", {
    configuration: "Debug",
    cwd: "snow-fox-daemon"
  });
  grunt_module.aliasMore("debug", "debug:daemon");
  grunt_module.alias("debug:daemon", "fake:daemon.debug");


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
  grunt_module.configure("cpplint", "daemon", {
    options: { root: "snow-fox-daemon/include" },
    src: [
      "snow-fox-daemon/include/**/*.h",
      "snow-fox-daemon/src/**/*.cpp"
    ]
  });
  grunt_module.configure("cppcheck", "daemon", {
    exclude: ["3rd-parties", "snow-fox-daemon/tests"],
    include: ["snow-fox-daemon/include", "3rd-parties/include"],
    save_to: "snow-fox-daemon/cppcheck.xml",
    src: [
      "snow-fox-daemon/include/**/*.h",
      "snow-fox-daemon/src/**/*.cpp"
    ]
  });

  grunt_module.aliasMore("jenkins", "jenkins:daemon");
  grunt_module.alias("jenkins:daemon", [
    "clean:daemon.jenkins",
    "fake:daemon.test",
    "shell:daemon.jenkins.test",
    "shell:daemon.jenkins.coverage",
    "cpplint:daemon",
    "cppcheck:daemon"
  ]);


  // Release aliases.
  grunt_module.configure("fake", "daemon.release", {
    configuration: "Release",
    cwd: "snow-fox-daemon"
  });
  grunt_module.aliasMore("release", "release:daemon");
  grunt_module.alias("release:daemon", "fake:daemon.release");


  // Test aliases.
  grunt_module.configure("fake", "daemon.test", {
    configuration: "Test",
    cwd: "snow-fox-daemon"
  });
  daemon_shell("daemon.test", "dist/Test/test");
  grunt_module.aliasMore("test", "test:daemon");
  grunt_module.alias("test:daemon", [
    "fake:daemon.test",
    "shell:daemon.test"
  ]);
};
