var assert = require("assert");
var mocha  = require("mocha");

var GruntMock    = require("../../grunt-mock");
var Components   = require("../../../components/components");
var CppComponent = require("../../../components/types/c++");
var ScriptsComponent = require("../../../components/types/scripts");


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
        include:  ["a/include", "te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp"]
      });
    });

    test("include dependencies headers but only for c++ deps", function() {
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

      var test = this.make({
        targets: { debug: { deps: ["a", "b"] } }
      });
      this.components.add(test);
      test.handleTarget("debug", this.components);

      this.grunt.task.assertTaskQueue(["g++:debug.test.core"]);
      assert.deepEqual(this.grunt.config("g++.debug\\.test\\.core"), {
        coverage: false,
        include:  ["a/include", "te/st/include"],
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
        include:  ["te/st/include"],
        objects_path: "out/build/debug",
        src: ["te/st/src/**/*.cpp", "!exclude1", "!exclude2"]
      });
    });
  });

  suite("Tasks by type", function() {
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
  });
});
