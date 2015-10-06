module.exports = function(grunt) {
  var path = require("path");

  grunt.registerMultiTask("npm-install", "Runs npm install.", function() {
    var done    = this.async();
    var fs      = require("fs");
    var npm     = require("npm");
    var options = this.options({
      dest: "./out"
    });

    // Only install npm if modules are not installed in src.
    var skipInstall = fs.existsSync(path.join(options.dest, "node_modules"));
    if (skipInstall) {
      grunt.log.writeln("Skipping npm install.");
      grunt.log.writeln(
          "A 'node_modules' directory was found.");
      grunt.log.writeln(
          "If the tests fail due to dependencies issues try delating it and");
      grunt.log.writeln("let me install the dependencies from scretch.");
      return done();
    }

    npm.load({
      prefix: options.dest
    }, function(err) {
      if (err) { return done(err); }

      npm.commands.install(function (err, data) {
        done(err);
      });
      npm.on("log", grunt.log.write.bind(grunt.log));
    });
  });
};
