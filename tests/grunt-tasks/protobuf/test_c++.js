var assert = require("assert");
var grunt  = require("grunt");
var mocha  = require("../grunt-suite");

gruntSuite("ProtoC task", "protobuf/c++", function() {
  setup(function(done) {
    var task_caller = this.grunt.taskCaller("protobuf-cpp");
    task_caller.async(done);

    task_caller.data({
      input_path:  "build-tools/tests/fixtures/protobuf/src",
      headers_out: "tmp/test/dist/debug/headers/te/st",
      objects_out: "tmp/test/build/debug/te/st",
      src: ["**/*.proto"]
    });

    this.children = task_caller.run();
  });

  test("command line is correct", function() {
    var children = this.children;
    var expected_files = [
      "build-tools/tests/fixtures/protobuf/src/message.proto",
      "build-tools/tests/fixtures/protobuf/src/nested/test.proto"
    ];

    expected_files.forEach(function(file, index) {
      var child = children[index];
      var cmd   = child._cmd;
      var args  = child._args;

      assert.equal(cmd, "protoc");
      assert.deepEqual(args, [
        "--proto_path", "build-tools/tests/fixtures/protobuf/src",
        "--cpp_out", "tmp/test/build/debug/te/st",
        file
      ]);
    });
  });

  test("expected files are generated", function() {
    var files = grunt.file.expand("tmp/test/build/debug/te/st/**/*.*");
    assert.deepEqual(files, [
      "tmp/test/build/debug/te/st/message.pb.cc",
      "tmp/test/build/debug/te/st/message.pb.h",
      "tmp/test/build/debug/te/st/nested/test.pb.cc",
      "tmp/test/build/debug/te/st/nested/test.pb.h"
    ]);
  });

  test("header files are copied", function() {
    var files = grunt.file.expand("tmp/test/dist/debug/headers/te/st/**/*.*");
    assert.deepEqual(files, [
      "tmp/test/dist/debug/headers/te/st/message.pb.h",
      "tmp/test/dist/debug/headers/te/st/nested/test.pb.h"
    ]);
  });

  test("maps files", function() {
    var maps = this.grunt.file.mapped;
    assert(maps.length, "expandMapping was never called");

    var mappings = maps[0].mappings;
    assert.deepEqual(mappings, [{
      dest: "tmp/test/build/debug/te/st/message.pb",
      src:  ["build-tools/tests/fixtures/protobuf/src/message.proto"]
    }, {
      dest: "tmp/test/build/debug/te/st/nested/test.pb",
      src:  ["build-tools/tests/fixtures/protobuf/src/nested/test.proto"]
    }]);
  });
});