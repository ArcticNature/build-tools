module.exports = function(grunt_module) {
  grunt_module.configure("mochaTest", "build-tools", {
    src: "build-tools/tests/**/test_*.js",
    options: {
      ignoreLeaks: false,
      ui: "tdd",

      reporter: "mocha-jenkins-reporter",
      reporterOptions: {
        junit_report_name: "built-tools",
        junit_report_path: "out/reports/build-tools/test-results.xml"
      }
    }
  });
  grunt_module.configure("clean", "build-tools", "tmp/");

  grunt_module.loadNpmTasks("grunt-mocha-test");
  grunt_module.alias("test-build-tools", ["mochaTest:build-tools"]);
  grunt_module.alias("test-build", ["test-build-tools", "clean:build-tools"]);
};
