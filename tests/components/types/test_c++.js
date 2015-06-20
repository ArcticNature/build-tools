var assert = require("assert");
var mocha  = require("mocha");
var path   = require("path");

var GruntMock    = require("../../grunt-mock");
var Component    = require("../../../components/component");
var Components   = require("../../../components/components");
var CppComponent = require("../../../components/types/c++");
var ScriptsComponent = require("../../../components/types/scripts");

var GCOVR_PATH = path.resolve("build-tools/gcovr");


suite("CppComponent", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.components = new Components();

    this.make = function make(config) {
      config = Object.create(config || {});
      config.grunt = grunt;
      config.name  = config.name || "test";
      config.path  = config.path || "te/st";
      return new CppComponent(config);
    };
  });

  test("Clear path", function() {
    var component = this.make();
    assert.deepEqual(component.getCleanPath("debug"), [
      "out/build/debug/te/st",
      "out/dist/debug/te/st"
    ]);
  });

  suite("Analysis tasks", function() {
    setup(function() {
      var component = this.make({ targets: { test: {} } });
      this.components.add(component);
      component.handleAnalysis(this.components);
    });

    test("linter configuration", function() {
      assert.deepEqual(this.grunt.config("cpplint.analysis\\.test"), {
        options: {
          root: "te/st/include",
          filter: [
            "-runtime/indentation_namespace"
          ]
        },
        src: ["te/st/include/**/*.h", "te/st/src/**/*.cpp"]
      });
    });

    test("static analysis configuration", function() {
      assert.deepEqual(this.grunt.config("cppcheck.analysis\\.test"), {
        exclude: ["3rd-parties", "te/st/tests"],
        include: ["te/st/include", "3rd-parties/include"],
        save_to: "out/reports/te/st/cppcheck.xml",
        src: [ "te/st/include/**/*.h", "te/st/src/**/*.cpp"]
      });
    });

    test("tasks queue", function() {
      this.grunt.task.assertTaskQueue([
        "cpplint:analysis.test",
        "cppcheck:analysis.test",
        "shell:analysis.test",
        "gcovr:analysis.test"
      ]);
    });

    test("tests configuration", function() {
      assert.deepEqual(this.grunt.config("shell.analysis\\.test"), {
        command: (
          "out/dist/test/te/st/run-tests --gtest_output='xml:" +
          "out/reports/te/st/test-results.xml'"
        )
      });
    });

    test("tests coverage configuration", function() {
      assert.deepEqual(this.grunt.config("gcovr.analysis\\.test"), {
        exclude: ".*(3rd-parties|tests).*",
        gcovr:   GCOVR_PATH,
        objects: "out/build/test/te/st/src",
        save_to: "out/reports/te/st/coverage.xml"
      });
    });
  });

  suite("Core tasks", function() {
    test("are created for debug", function() {
      var component = this.make({
        targets: { debug: {} }
      });
      this.components.add(component);
      component.handleTarget("debug", this.components);

      this.grunt.task.assertTaskQueue(["g++:debug.test.core"]);
      assert.deepEqual(this.grunt.config("g++.debug\\.test\\.core"), {
        coverage: false,
        debug:    true,
        include:  ["te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp"]
      });
    });

    test("include dependencies headers", function() {
      this.components.add(this.make({
        name: "a",
        path: "a",
        targets: { debug: {} }
      }));

      var test = this.make({
        targets: { debug: { deps: ["a"] } }
      });
      this.components.add(test);
      test.handleTarget("debug", this.components);

      this.grunt.task.assertTaskQueue(["g++:debug.test.core"]);
      assert.deepEqual(this.grunt.config("g++.debug\\.test\\.core"), {
        coverage: false,
        debug:    true,
        include:  ["a/include", "te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp"]
      });
    });

    test("include dependencies headers but only for c++ and scripts deps", function() {
      this.components.add(this.make({
        name: "a",
        path: "a",
        targets: { debug: {} }
      }));
      this.components.add(new ScriptsComponent({
        grunt: this.grunt,
        name:  "b",
        path:  "b",
        "clear-path": "c",
        targets: { debug: { tasks: [] } }
      }));
      this.components.add(new Component({
        grunt: this.grunt,
        name:  "c",
        "clear-path": "c",
        targets: { debug: { tasks: [] } }
      }));

      var test = this.make({
        targets: { debug: { deps: ["a", "b", "c"] } }
      });
      this.components.add(test);
      test.handleTarget("debug", this.components);

      this.grunt.task.assertTaskQueue(["g++:debug.test.core"]);
      assert.deepEqual(this.grunt.config("g++.debug\\.test\\.core"), {
        coverage: false,
        debug:    true,
        include:  ["a/include", "b/include", "te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp"]
      });
    });

    test("support file exclusions", function() {
      var component = this.make({
        exclude: ["exclude1"],
        targets: { debug: { exclude: ["exclude1", "exclude2"] } }
      });
      this.components.add(component);
      component.handleTarget("debug", this.components);

      this.grunt.task.assertTaskQueue(["g++:debug.test.core"]);
      assert.deepEqual(this.grunt.config("g++.debug\\.test\\.core"), {
        coverage: false,
        debug:    true,
        include:  ["te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp", "!exclude1", "!exclude2"]
      });
    });
  });

  suite("Tasks by type", function() {
    test("bin calls link++", function() {
      var components = this.components;
      var component  = this.make({
        targets: { debug: { type: "bin" } }
      });

      components.add(component);
      component.handleTarget("debug", components);

      this.grunt.task.assertTaskQueue([
        "g++:debug.test.core", "link++:debug.test.bin"
      ]);
      assert.deepEqual(this.grunt.config("link++.debug\\.test\\.bin"), {
        libs: [],
        files: [{
          dest: "out/dist/debug/te/st/test",
          src:  ["out/build/debug/te/st/**/*.o"]
        }]
      });
    });

    test("bin finds static libraries from deps", function() {
      var components = this.components;
      var component  = this.make({
        targets: { debug: { type: "bin", deps: ["test.a"] } }
      });

      components.add(this.make({
        name: "a",
        targets: { test: { type: "lib" } }
      }));

      components.add(component);
      component.handleTarget("debug", components);

      this.grunt.task.assertTaskQueue([
        "g++:debug.test.core", "link++:debug.test.bin"
      ]);
      assert.deepEqual(this.grunt.config("link++.debug\\.test\\.bin"), {
        libs: [],
        files: [{
          dest: "out/dist/debug/te/st/test",
          src:  ["out/build/debug/te/st/**/*.o", "out/dist/test/te/st/a.a"]
        }]
      });
    });

    test("bin includes libraries from deps", function() {
      var components = this.components;
      var component  = this.make({
        libs: ["lua"],
        targets: { debug: { type: "bin", deps: ["test.a"] } }
      });

      components.add(this.make({
        name: "a",
        libs: ["gflags"],
        targets: { test: { type: "lib" } }
      }));

      components.add(component);
      component.handleTarget("debug", components);

      this.grunt.task.assertTaskQueue([
        "g++:debug.test.core", "link++:debug.test.bin"
      ]);
      assert.deepEqual(this.grunt.config("link++.debug\\.test\\.bin"), {
        libs: ["gflags", "lua"],
        files: [{
          dest: "out/dist/debug/te/st/test",
          src:  ["out/build/debug/te/st/**/*.o", "out/dist/test/te/st/a.a"]
        }]
      });
    });

    test("fails if type is not recognised", function() {
      var components = this.components;
      var component  = this.make({
        targets: { debug: { type: "--not-valid--" } }
      });

      components.add(component);
      var block = function() {
        component.handleTarget("debug", components);
      };

      assert.throws(block, /Unrecognised target type '--not-valid--'/);
    });

    test("lib calls ar", function() {
      var components = this.components;
      var component  = this.make({
        targets: { debug: { type: "lib" } }
      });

      components.add(component);
      component.handleTarget("debug", components);

      this.grunt.task.assertTaskQueue([
        "g++:debug.test.core", "ar:debug.test.lib"
      ]);
      assert.deepEqual(this.grunt.config("ar.debug\\.test\\.lib"), {
        files: [{
          dest: "out/dist/debug/te/st/test.a",
          src:  "out/build/debug/te/st/**/*.o"
        }]
      });
    });
    
    test("test compiles gtest", function() {
      var components = this.components;
      var component  = this.make({
        targets: { test: { type: "bin" } }
      });

      components.add(component);
      component.handleTarget("test", components);

      this.grunt.task.assertTaskQueue([
        "g++:test.test.core", "link++:test.test.bin",
        "g++:test.test.gtest", "link++:test.test.gtest"
      ]);
      assert.deepEqual(this.grunt.config("g++.test\\.test\\.gtest"), {
        coverage: true,
        debug:    true,
        include:  ["3rd-parties/include", "3rd-parties/sources/gtest"],
        objects_path: "out/build/gtest",
        src: [
          "3rd-parties/sources/gtest/src/gtest-all.cc",
          "3rd-parties/sources/gtest/src/gtest_main.cc"
        ]
      });
      assert.deepEqual(this.grunt.config("link++.test\\.test\\.gtest"), {
        libs: ["pthread", "gcov"],
        files: [{
          dest: "out/dist/test/te/st/run-tests",
          src:  [
            "out/build/test/te/st/**/*.o",
            "!out/build/test/te/st/**/main.o",
            "out/build/gtest/**/*.o"
          ]
        }]
      });
    });
  });
});
