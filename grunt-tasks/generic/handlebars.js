var fs   = require("fs");
var path = require("path");

var Handlebars = require("handlebars");
var Promise = require("q");
var GitSha  = require("../../utils/git-sha");


var make_environment = function make_environment(grunt) {
  // Sync side of things.
  var handlebars = Handlebars.create();
  handlebars.registerHelper("findFile", function() {
    for (var idx = 0; idx < arguments.length - 1; idx++) {
      var file = arguments[idx];
      if (grunt.file.exists(file)) {
        return file;
      }
    }
    return null;
  });

  // Wrap environment in a promise and do async side of things.
  var promise = Promise.when({ env: handlebars });

  //  -> git sha
  promise = GitSha.get_commit_sha(promise, ".");
  promise = promise.then(function(continuation) {
    var env = continuation.env;
    var sha = continuation.sha;

    env.registerHelper("__GIT_SHA__", function(precision, options) {
      if (!options) {
        options = precision;
        precision = 8;
      }
      return precision == 0 ? sha : sha.substr(0, precision);
    });

    return env;
  });

  //  -> git tainted
  promise = promise.then(function(env) {
    return { env: env };
  });
  promise = GitSha.get_change_info(promise, ".");
  promise = promise.then(function(continuation) {
    var env = continuation.env;

    env.registerHelper("__GIT_TAINT__", function() {
      if (continuation.work_changed) {
        return "git working directory tainted";
      }
      if (continuation.index_changed) {
        return "git index tainted";
      }
      return "git commit untainted";
    });

    return env;
  });

  return promise;
};


module.exports = function(grunt) {
  var task = function task() {
    // Get options.
    var done   = this.async();
    var file   = this.files[0];
    var dest   = file.dest;
    var source = file.src[0];
    var options = this.options({ data: {} });
    var data    = options.data;

    // Get environment.
    var promise = make_environment(grunt);

    // Generate file.
    promise = promise.then(function(handlebars) {
      var raw = grunt.file.read(source);
      var template = handlebars.compile(raw, { noEscape: true });
      return template(data);
    });

    // Only write to file if content is different.
    promise = promise.then(function(content) {
      var old = null;
      if (grunt.file.exists(dest)) {
        old = grunt.file.read(dest);
      }

      if (old !== content) {
        grunt.file.write(dest, content);
        grunt.log.ok("Template generation complete.");

      } else {
        grunt.log.ok("Did not generate up-to date template.");
      }
    });

    // Fullfill/reject promise.
    promise.then(done).fail(done);
  };

  grunt.registerMultiTask(
    "handlebars", "Expand templates with Handlebars.", task
  );
};
