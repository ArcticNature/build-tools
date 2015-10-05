var assert = require("assert");
var fs = require("fs");
var grunt = require("grunt");
var mocha = require("../grunt-suite");


gruntSuite("ProtoJS task", "protobuf/js", function() {
  setup(function(done) {
    var task_caller = this.task_caller = this.grunt.taskCaller("protobuf-js");
    task_caller.async(done);

    task_caller.data({
      minify: false,
      output: "tmp/test/protobuf/js/test-pb.js",
      src: ["build-tools/tests/fixtures/protobuf/src/**/*.proto"]
    });

    // Make sure output files are not there to avoid the optimization.
    var targets = ["tmp/test/protobuf/js/test-pb.js"];
    targets.forEach(function(target) {
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
    });

    // Run test task.
    this.grunt.file.real_expand = true;
    this.pbjs = task_caller.run();
  });

  test("compiler is called", function() {
    assert(this.pbjs, "pbjs compiler not called.");
  });

  test("output is created", function() {
    var target = "tmp/test/protobuf/js/test-pb.js";
    assert(fs.existsSync(target), "JS output not created");
  });

  test("compiler is not called if no files change", function(done) {
    var task_caller = this.task_caller;

    var continuation = function(result) {
      try {
        assert(
            task_caller.latest_result === null,
            "pbjs called too many times."
        );
        done(result);

      } catch (ex) {
        done(ex);
      }
    };

    task_caller.async(continuation);
    task_caller.run();
  });
});
