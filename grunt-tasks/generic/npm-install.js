module.exports = function(grunt) {
  var fs   = require("fs");
  var path = require("path");
  var SubProcess = require("../../utils/subprocess");

  grunt.registerMultiTask("npm-install", "Runs npm install.", function() {
    var options = this.options({
      dest: "./out"
    });

    // Only install npm if modules are not installed in src.
    var skipInstall = fs.existsSync(path.join(options.dest, "node_modules"));
    if (skipInstall) {
      grunt.log.writeln("Skipping npm install.");
      grunt.log.writeln(
          "A 'node_modules' directory was found."
      );
      grunt.log.writeln(
          "If the tests fail due to dependencies issues try delating it and"
      );
      grunt.log.writeln("let me install the dependencies from scretch.");
      return;
    }

    // Call npm install from the target directory.
    var npm = new SubProcess(grunt.log, {
      args: ["install"],
      cmd:  "npm",
      cwd:  options.dest
    });

    var done = this.async();
    npm.spawn().then(function() {
      done();

    }).fail(function(code) {
      done(new Error(code));
    });
  });
};
