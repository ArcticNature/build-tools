module.exports = function(grunt) {
  var assert = require("assert");
  var fs   = require("fs");
  var path = require("path");

  var SubProcess = require("../../utils/subprocess");

  var protobuf_cpp = function protobuf_cpp() {
    // Prepare task and options.
    var options = this.options({
      // Required options.
      base_path:    null,
      objects_path: null,
      src: null
    }, this.data);

    // Assert require parameters were provided.
    assert(options.base_path, "A base path for the proto files is required.");
    assert(options.objects_path, "A path of the object files is required.");
    assert(options.src, "A list of files to compile.");

    // Build paths.
    var sources = grunt.file.expandMapping(options.src, options.objects_path, {
      ext:    ".pb",
      extDot: "last"
    });

    // TODO(stefano): Check last modified to see if re-generation is needed.

    // Bail if dry run.
    if (grunt.option("no-write")) {
      return;
    }

    // Generare SubProcess instances.
    var children = sources.map(function(source) {
      // Ensure target path exists.
      var target = path.dirname(source.dest);
      if (!fs.existsSync(target)) {
        grunt.file.mkdir(target);
      }

      // Build arguments.
      var instance_args = [
        "--proto_path", options.base_path,
        "--cpp_out", target, source.src[0]
      ];

      // Return subprocess wrapper.
      return new SubProcess(grunt.log, {
        args: instance_args,
        cmd:  "protoc"
      });
    });

    // And compile!
    var done = this.async();
    SubProcess.spawnAll(children, grunt.option("parallel")).then(function() {
      done();
    }).fail(function(code) {
      done(new Error(code));
    });
  };

  grunt.registerMultiTask(
      "protobuf-cpp", "Compile protocol buffers to C++.", protobuf_cpp
  );
};
