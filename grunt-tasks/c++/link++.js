module.exports = function(grunt) {
  var fs   = require("fs");
  var path = require("path");

  var SubProcess  = require("../../utils/subprocess");
  var extend_args = function extend_args(args, check, to_add) {
    if (check) {
      args.push.apply(args, to_add);
    }
  };

  grunt.registerMultiTask("link++", "G++ link object files.", function() {
    // Prepare task and options.
    var options = this.options({
      debug: true,
      libs:  null,
      coverage: true,
      optimise: null
    }, this.data);

    // Find files to process.
    var sources = this.files.filter(function(source) {
      try {
        var oldest = Math.min(source.src.map(function(input) {
          return fs.statSync(input).mtime.getTime();
        }));
        var target = fs.statSync(path.normalize(source.dest)).mtime.getTime();
        return oldest >= target;

      } catch(ex) { /* NOOP */ }
      return true;
    });
    if (sources.length === 0) {
      grunt.log.ok("Target up to date, nothing to do.");
      return;
    }

    // Ensure target paths exist.
    sources.map(function(source) {
      var target = path.dirname(path.normalize(source.dest));
      if (!fs.existsSync(target)) {
        grunt.file.mkdir(target);
      }
    });
    if (grunt.option("no-write")) {
      return;
    }

    // Archive each target.
    var children = [];
    for (var idx=0; idx < sources.length; idx++) {
      var source = sources[idx];
      var args   = [];

      // Options.
      extend_args(args, options.debug, ["-g"]);
      extend_args(args, options.coverage, [
        "-fprofile-arcs", "-ftest-coverage", "-rdynamic"
      ]);
      extend_args(args, options.optimise !== null, ["-O" + options.optimise]);

      // Libs.
      if (Array.isArray(options.libs) && options.libs.length > 0) {
        args.push.apply(args, options.libs.map(function(lib) {
          return "-l" + path.normalize(lib);
        }));
      }

      // Source files.
      args.push("-o", path.normalize(source.dest));
      args.push.apply(args, source.src);
      children.push(new SubProcess(grunt.log, {
        args: args,
        cmd:  "g++"
      }));
    }

    // Run ars!
    var done = this.async();
    SubProcess.spawnAll(children).then(function() {
      done();
    });
  });
};
