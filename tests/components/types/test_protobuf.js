var assert = require("assert");
var mocha  = require("mocha");
//var path   = require("path");

var GruntMock    = require("../../grunt-mock");
var Components = require("../../../components/components");
var ProtoBuf   = require("../../../components/types/protobuf");


suite("ProtoBuf Component", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.components = new Components();

    this.make = function make(config) {
      config = Object.create(config || {});
      config.grunt = grunt;
      config.name  = config.name || "test";
      config.path  = config.path || "te/st";
      return new ProtoBuf(config);
    };
  });

  test("Clear path", function() {
    var component = this.make();
    assert.deepEqual(component.getCleanPath("debug"), [
      "out/build/debug/te/st",
      "out/dist/debug/te/st",
      "out/dist/debug/headers/te/st"
    ]);
  });

  test("C/C++ headers path", function() {
    var component = this.make();
    assert.deepEqual(component.getCppHeaders("debug"), [
      "out/dist/debug/headers"
    ]);
  });

  test("C/C++ static library", function() {
    var component = this.make();
    assert.deepEqual(component.getStaticLibs("debug"), [
      "out/dist/debug/te/st/test.a"
    ]);
  });

  suite("Analysis tasks", function() {
    test("logs the skip message", function() {
      var component = this.make();
      component.handleAnalysis(this.components);

      assert.deepEqual(this.grunt.log.ok_logs, [
        "Skipping analysis of Protocol Buffer component 'test'"
      ]);
    });

    test("assert no jobs are configured.", function() {
      var component = this.make();
      component.handleAnalysis(this.components);
      this.grunt.config.assertEmpty();
    });

    test("tasks queue is empty", function() {
      this.grunt.task.assertTaskQueue([]);
    });
  });

  suite("Protoc tasks", function() {
    setup(function() {
      this.component = this.make({
        targets: { debug: {} }
      });
      this.component.handleTarget("debug", this.components);
    });

    test("tasks queued", function() {
      this.grunt.task.assertTaskQueue([
        "protobuf-cpp:debug.test",
        "g++:debug.test",
        "ar:debug.test"
      ]);
    });

    test("protobuf-cpp configured", function() {
      assert.deepEqual(this.grunt.config("protobuf-cpp.debug\\.test"), {
        input_path:  "te/st/src",
        headers_out: "out/dist/debug/headers/te/st",
        objects_out: "out/build/debug/te/st",
        src: ["**/*.proto"]
      });
    });
  });
});