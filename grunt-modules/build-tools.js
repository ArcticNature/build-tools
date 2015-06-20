module.exports = function(grunt_module) {
  grunt_module.configure("mochaTest", "build-tools", {
    src: "build-tools/tests/**/test_*.js",
    options: {
      ignoreLeaks: false,
      ui: "tdd"
    }
  });

  grunt_module.loadNpmTasks("grunt-mocha-test");
  grunt_module.alias("test-build-tools", ["mochaTest:build-tools"]);
};
