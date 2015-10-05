module.exports = function(grunt) {
  var assert = require("assert");
  var fs   = require("fs");
  var path = require("path");

  var SubProcess = require("../../utils/subprocess");


  var protobuf_js = function protobuf_js() {
    // Prepare task and options.
    var options = this.options({
      output: null,
      src: null,

      // Optionals.
      minify: true,
      target: "commonjs"
    }, this.data);

    assert(options.output, "An output file is required.");
    assert(options.src, "A (list of) globs for files to compile is needed.");

    // Check last modified to see if re-generation is needed.
    var sources = grunt.file.expand(options.src);
    var changed = sources.filter(function (source) {
      try {
        var dest_time = fs.statSync(options.output).mtime.getTime();
        var src_time  = fs.statSync(source).mtime.getTime();
        return src_time > dest_time;

      } catch(ex) { /* NOOP */ }
      return true;
    });

    if (changed.length === 0) {
      grunt.log.ok("Target up to date, nothing to do.");
      return null;
    }

    // Bail if dry run.
    if (grunt.option("no-write")) {
      return null;
    }

    // Build command line.
    var args = ["--target", options.target];
    if (options.minify) {
      args.push("--min");
    }
    args.push.apply(args, sources);

    // Generare SubProcess instance.
    var pbjs = new SubProcess(grunt.log, {
      args: args,
      cmd:  "./node_modules/protobufjs/bin/pbjs",
      stdout: options.output
    });

    // Ensure output directory exists.
    var output_target = path.dirname(options.output);
    if (!fs.existsSync(output_target)) {
      grunt.file.mkdir(output_target);
    }

    // And compile!
    var done = this.async();
    pbjs.spawn().then(function() {
      done();
    }).fail(function(code) {
      done(new Error("Failed to compile ProtoBuf to JavaScript: " + code));
    });
    return pbjs;
  };

  grunt.registerMultiTask(
      "protobuf-js", "Compile protocol buffers to JavaScript.",
      protobuf_js
  );
};
