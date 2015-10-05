module.exports = function(grunt) {
  var assert = require("assert");
  var fs   = require("fs");
  var path = require("path");

  var SubProcess = require("../../utils/subprocess");

  var protobuf_cpp = function protobuf_cpp() {
    // Prepare task and options.
    var options = this.options({
      input_path:  null,
      headers_out: null,
      objects_out: null,
      src: null
    }, this.data);

    // Assert require parameters were provided.
    assert(options.input_path, "Input path for proto files is required.");
    assert(
        options.headers_out,
        "Output path for the generated header files is required."
    );
    assert(
        options.objects_out,
        "Output path for the generated C++ files is required."
    );
    assert(options.src, "A list of files to compile is needed.");

    // Build paths.
    var sources = grunt.file.expandMapping(options.src, options.objects_out, {
      cwd: options.input_path,
      ext: ".pb",
      extDot: "last"
    });

    // Check last modified to see if re-generation is needed.
    sources = sources.filter(function (source) {
      try {
        var base    = path.normalize(source.dest);
        var start   = fs.statSync(source.src[0]).mtime.getTime();
        var targets = [
          base + ".cc", base + ".h",
          options.headers_out + source.dest.substr(
              options.objects_out.length
          ) + ".h"
        ];

        var newest = Math.max.apply(Math, targets.map(function(input) {
          return fs.statSync(input).mtime.getTime();
        }));
        return start > newest;

      } catch(ex) { /* NOOP */ }
      return true;
    });

    if (sources.length === 0) {
      grunt.log.ok("Target up to date, nothing to do.");
      return;
    }

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
        "--proto_path", options.input_path,
        "--cpp_out", options.objects_out, source.src[0]
      ];

      // Return subprocess wrapper.
      return new SubProcess(grunt.log, {
        args: instance_args,
        cmd:  "protoc"
      });
    });

    // And compile!
    var done = this.async();
    var promise = SubProcess.spawnAll(children, grunt.option("parallel"));

    // Copy the generated heade files.
    promise = promise.then(function() {
      var headers = grunt.file.expandMapping("**/*.pb.h", options.headers_out, {
        cwd: options.objects_out
      });

      headers.forEach(function(header) {
        grunt.file.copy(header.src[0], header.dest);
      });
    });

    promise.then(function() {
      done();
    }).fail(function(code) {
      done(new Error(code));
    });

    // Return children for tests to examine.
    return children;
  };

  grunt.registerMultiTask(
      "protobuf-cpp", "Compile protocol buffers to C++.", protobuf_cpp
  );
};
