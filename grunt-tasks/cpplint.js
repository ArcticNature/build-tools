var Q = require("q");
var SubProcess = require("../utils/subprocess");


module.exports = function(grunt) {
  var run_lint = function run_lint(files, options) {
    // Prepare arguments.
    var args  = [
      options.cpplint,
      "--counting=" + options.counting,
      "--output="   + options.output,
      "--root=" + options.root,
      "--verbose=" + options.verbose
    ];
    args.push.apply(args, files);

    // Spawn command.
    var child = new SubProcess({
      args: args,
      cmd:  "python",
      stderr: options.save_to
    });

    // And wait for its return.
    var promise = child.spawn();
    if (options.silent) {
      promise = promise.fail(function(code) { return; });
    }
    return promise;
  };

  grunt.registerMultiTask("cpplint", "CppLint.py runner.", function() {
    // Prepare task and options.
    var options = this.options({
      counting: "detailed",
      cpplint:  "build-tools/cpplint.py",
      output:   "vs7",
      save_to:  null,
      silent:   true,
      verbose:  0,

      // Required arguments.
      root: null
    });

    // Assert root is provided.
    if (!options.root) {
      throw new Error("cpplint task require a root option.");
    }

    // Run CppLint for each file group.
    var promises = [];
    for (var idx=0; idx<this.files.length; idx++) {
      var files = this.files[idx].src;
      promises.push(run_lint(files, options));
    }

    // Wait for all promises.
    var done = this.async();
    Q.all(promises).then(function() {
      done();
    }).fail(function(code) {
      throw new Error("CppLint failed with code: " + code);
    });
  });
};
