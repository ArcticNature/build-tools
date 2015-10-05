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
      "out/dist/debug/te/st"
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
        dest: "out/dist/debug/te/st/deps/dep",
        cwd:  "out/dist/debug/d/e/p",
        src:  "dep.js"
      }]
    });
  });

  suite("handle debug", function() {
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
          dest: "out/dist/debug/te/st",
          src:  ["**/*.js", "!node_modules/**"]
        }, {
          expand: true,
          cwd:  "te/st",
          dest: "out/dist/debug/te/st",
          src:  ["package.json"]
        }]
      });
    });

    test("tasks queued", function() {
      this.grunt.task.assertTaskQueue(["copy:debug.test"]);
    });
  });
});
