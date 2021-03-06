var assert = require("assert");
var mocha  = require("mocha");

var GruntMock  = require("../../grunt-mock");
var Components = require("../../../components/components");
var NodeJS   = require("../../../components/types/nodejs");
var ProtoBuf = require("../../../components/types/protobuf");


suite("NodeJS Component", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.components = new Components();

    this.make = function make(config, klass) {
      config = Object.create(config || {});
      config.grunt = grunt;
      config.name  = config.name || "test";
      config.path  = config.path || "te/st";
      
      klass = klass || NodeJS;
      return new klass(config);
    };
  });

  test("Clear path", function() {
    var component = this.make();
    assert.deepEqual(component.getCleanPath("debug"), [
      "out/build/debug/te/st",
      "out/dist/debug/te/st",
      "out/reports/te/st"
    ]);
  });

  test("Copy dependencies", function() {
    // Create component and dependency.
    var dep = this.make({
      name: "dep",
      path: "d/e/p",
      generate: { js: true },
      targets: { debug: {} }
    }, ProtoBuf);
    var component = this.make({
      deps: ["dep"],
      targets: { debug: {} }
    });

    // Handle the target.
    this.components.add(dep);
    this.components.add(component);
    component.handleTarget("debug", this.components);

    // Assert that deps aare copied.
    assert.deepEqual(this.grunt.config("copy.debug\\.test\\.deps"), {
      files: [{
        expand: true,
        dest: "out/dist/debug/te/st/module/deps/dep",
        cwd:  "out/dist/debug/d/e/p",
        src:  "dep.js"
      }]
    });
  });

  suite("Handle Analysis", function() {
    setup(function() {
      this.component = this.make({
        targets: { debug: {} },
        jshint: {
          globals: {
            dummy: false,
            something: true
          }
        }
      });

      this.components.add(this.component);
      this.component.handleAnalysis(this.components);
    });

    test("jshint is configured", function() {
      var config = {};
      config.globals = {};

      Object.keys(NodeJS.JSHINT_DEFAULTS).forEach(function(key) {
        config[key] = NodeJS.JSHINT_DEFAULTS[key];
      });
      Object.keys(NodeJS.JSHINT_KNOWN_GLOBALS).forEach(function(key) {
        config.globals[key] = NodeJS.JSHINT_KNOWN_GLOBALS[key];
      });

      config.globals.dummy = false;
      config.globals.something = true;

      assert.deepEqual(this.grunt.config("jshint.test\\.test"), {
        options: config,
        files: { src: [
          "out/dist/test/te/st/**/*.js",
          "!out/dist/test/te/st/module/deps/**",
          "!**/node_modules/**"
        ] }
      });
    });

    test("jshint task is loaded", function() {
      this.grunt.assertNpmTaskLoaded("grunt-contrib-jshint");
    });

    test("mocha is configured", function() {
      assert.deepEqual(this.grunt.config("mochaTest.test\\.test"), {
        options: {
          ignoreLeaks: false,
          ui: "tdd",

          reporter: "mocha-jenkins-reporter",
          reporterOptions: {
            junit_report_name: "test",
            junit_report_path: "out/reports/te/st/test-results.xml"
          }
        },
        src: "out/dist/test/te/st/tests/**/test_*.js"
      });
    });

    test("npm is configured", function() {
      assert.deepEqual(this.grunt.config("npm-install.test\\.test"), {
        options: {
          dest: "out/dist/test/te/st/module"
        }
      });
    });

    test("tasks queued", function() {
      this.grunt.task.assertTaskQueue([
        "copy:test.test.tests",
        "jshint:test.test",
        "npm-install:test.test",
        "mochaTest:test.test"
      ]);
    });

    test("tests are copied", function() {
      assert.deepEqual(this.grunt.config("copy.test\\.test\\.tests"), {
        files: [{
          expand: true,
          cwd:  "te/st/tests",
          dest: "out/dist/test/te/st/tests",
          src:  ["**/*.js", "!node_modules/**"]
        }]
      });
    });
  });

  suite("Handle debug", function() {
    setup(function() {
      this.component = this.make({
        targets: { debug: {} }
      });

      this.components.add(this.component);
      this.component.handleTarget("debug", this.components);
    });

    test("copy task is loaded", function() {
      this.grunt.assertNpmTaskLoaded("grunt-contrib-copy");
    });

    test("copies sources", function() {
      assert.deepEqual(this.grunt.config("copy.debug\\.test"), {
        files: [{
          expand: true,
          cwd:  "te/st/src",
          dest: "out/dist/debug/te/st/module",
          src:  ["**/*.js", "!node_modules/**"]
        }, {
          expand: true,
          cwd:  "te/st",
          dest: "out/dist/debug/te/st/module",
          src:  ["package.json"]
        }]
      });
    });

    test("tasks queued", function() {
      this.grunt.task.assertTaskQueue(["copy:debug.test"]);
    });
  });
});
