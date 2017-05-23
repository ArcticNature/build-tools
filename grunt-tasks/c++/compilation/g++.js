module.exports = function(grunt) {
  var assert = require("assert");
  var fs   = require("fs");
  var path = require("path");

  var SubProcess  = require("../../../utils/subprocess");
  var extend_args = function extend_args(args, check, to_add) {
    if (check) {
      args.push.apply(args, to_add);
    }
  };

  var gpp_task = function() {
    // Prepare task and options.
    var options = this.options({
      coverage: true,
      debug:    true,
      include:  null,
      optimise: null,
      standard: "c++11",

      // Required options.
      objects_path: null
    }, this.data);

    // Assert require parameters were provided.
    assert(options.objects_path, "A path of the object files is required.");

    // Build paths.
    var sources = grunt.file.expandMapping(options.src, options.objects_path, {
      ext:    ".o",
      extDot: "last"
    });

    // Check all additional include files.
    // If any of them was modified after the target re-build it.
    var include_last_modified = 0;
    if (options.include && options.include.length > 0) {
      // Find greatest last modified time for each include path.
      var times = options.include.map(function(include) {
        var headers = grunt.file.expand(include + "/**/*.{h,hpp}");
        headers = headers.map(function(header) {
          return fs.statSync(header).mtime.getTime();
        });

        if (headers.length === 1) {
          return headers[0];
        }
        return Math.max.apply(Math, headers);
      });

      if (times.length === 1) {
        include_last_modified = times[0];
      }
      include_last_modified = Math.max.apply(Math, times) || 0;
    }

    // Filter paths based on last edit time.
    sources = sources.filter(function(source) {
      try {
        var src    = fs.statSync(source.src[0]).mtime.getTime();
        var target = fs.statSync(source.dest).mtime.getTime();
        return Math.max(src, include_last_modified) > target;

      } catch(ex) { /* NOOP */ }
      return true;
    });
    if (sources.length === 0) {
      grunt.log.ok("Objects up to date, nothing to do.");
      return;
    }

    // Ensure paths exist.
    sources.map(function(source) {
      var target = path.dirname(source.dest);
      if (!fs.existsSync(target)) {
        grunt.file.mkdir(target);
      }
    });
    if (grunt.option("no-write")) {
      return;
    }

    // Build arguments.
    var args = ["-c", "-std=" + options.standard];
    extend_args(args, options.debug, ["-g"]);
    extend_args(args, options.coverage, ["-fprofile-arcs", "-ftest-coverage"]);
    extend_args(args, options.optimise !== null, ["-O" + options.optimise]);

    if (Array.isArray(options.include) && options.include.length > 0) {
      args.push.apply(args, options.include.map(function(include) {
        return "-I" + path.normalize(include);
      }));
    }

    // Generare SubProcess instances.
    var children = sources.map(function(source) {
      var instance_args = [];
      instance_args.push.apply(instance_args, args);
      instance_args.push("-o", source.dest, source.src[0]);
      return new SubProcess(grunt.log, {
        args: instance_args,
        cmd:  "g++"
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

  grunt.registerMultiTask("g++", "Compile C++ sources into objects.", gpp_task);
};
