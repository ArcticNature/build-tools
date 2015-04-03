module.exports = function(grunt) {
  var fs   = require("fs");
  var path = require("path");

  var SubProcess = require("../../utils/subprocess");

  grunt.registerMultiTask("ar", "Archive object files.", function() {
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
      var args   = ["-rvs", path.normalize(source.dest)];
      args.push.apply(args, source.src);

      children.push(new SubProcess(grunt.log, {
        args: args,
        cmd:  "ar"
      }));
    }

    // Run ars!
    var done = this.async();
    SubProcess.spawnAll(children).then(function() {
      done();
    }).fail(function(code) {
      done(new Error(code));
    });
  });
};
