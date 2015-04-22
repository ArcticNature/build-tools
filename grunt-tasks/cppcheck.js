var fs   = require("fs");
var path = require("path");
var Q    = require("q");
var SubProcess = require("../utils/subprocess");


module.exports = function(grunt) {
  var run_check = function run_check(files, options) {
    var prefix = function prefix(pref) {
      return function(name) {
        return pref + name;
      };
    };

    // Ensure target paths exist.
    var target = path.dirname(path.normalize(options.save_to));
    if (!fs.existsSync(target)) {
      grunt.file.mkdir(target);
    }
    if (grunt.option("no-write")) {
      return;
    }

    // Prepare arguments.
    var args = [];
    args.push.apply(args, options.include.map(prefix("-I")));
    args.push.apply(args, options.exclude.map(prefix("-i")));
    args.push("--enable=" + options.enable, "--xml", "--xml-version=2");
    args.push.apply(args, files);

    // Spawn command.
    var child = new SubProcess(grunt.log, {
      args: args,
      cmd:  "cppcheck",
      stderr: options.save_to
    });

    // And wait for its return.
    var promise = child.spawn();
    if (options.silent) {
      promise = promise.fail(function() { return; });
    }
    return promise;
  };

  grunt.registerMultiTask("cppcheck", "CppCheck runner.", function() {
    // Prepare task and options.
    var options = this.options({
      enable:  "all",
      exclude: [],
      include: [],
      silent:  true,

      // Required options.
      save_to: null
    }, this.data);

    // Assert save_to is set.
    if (!options.save_to) {
      throw new Error("CppCheck requires save_to option.");
    }

    // Run CppCheck for each file group.
    var promises = [];
    for (var idx=0; idx<this.files.length; idx++) {
      var files = this.files[idx].src;
      promises.push(run_check(files, options));
    }

    // Wait for all promises.
    var done = this.async();
    Q.all(promises).then(function() {
      done();
    }).fail(function(code) {
      throw new Error("CppCheck failed with code: " + code);
    });
  });
};
