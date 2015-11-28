var path = require("path");
var Git  = require("nodegit");
var Promise = require("q");

var Component = require("./components/component");

/**
 * Get the sha for the latest commit on the current branch.
 * @param {!Promise} promise The promise chain to forward.
 * @returns {!Promise}
 *     A promise that resolves to the commit sha and the value returned
 *     by the given promise (which should be the archive name).
 */
var get_commit_sha = function get_commit_sha(promise) {
  return promise.then(function(continuation) {
    return Git.Repository.open(".").then(function(repo) {
      return repo;

    }).then(function(repo) {
      return repo.head().then(function(branch) {
        return repo.getReferenceCommit(branch);
      });

    }).then(function(commit) {
        continuation.sha = commit.sha();
        return continuation;
    });
  });
};


var DistributionBuilder = module.exports = function DistributionBuilder(
    components, packages, options, grunt
) {
  this._components = components;
  this._grunt = grunt;
  this._options = options || {};
  this._packages = packages;
};

DistributionBuilder.prototype._getComponents = function _getComponents(pkgs) {
  var components = {};
  var packages = this._packages;

  pkgs.forEach(function(pkg) {
    var keys = Object.keys(packages[pkg] || {});
    keys.forEach(function(key) {
      components[key] = true;
    });
  });

  return Object.keys(components);
};

DistributionBuilder.prototype._scheduleTasks = function _scheduleTasks(
    components
) {
  var _this = this;
  var resolved = [];
  
  // Clean packages directory.
  this._grunt.config("clean.distribute", ["out/packages"]);
  this._grunt.task.run("clean:distribute");
  this._grunt.log.verbose.ok("Scheduled clean of target directory");

  // Resolve components.
  components.forEach(function(component) {
    resolved.push.apply(resolved, _this._components.resolve(
        component, "release"
    ));
  });

  // Filter duplicates.
  //   The check function needs the name in the object.
  resolved.forEach(function(component) {
    component.name = component.instance.name();
  });
  resolved = Component.checkDependenciesList(resolved);

  // Schedule tasks.
  var instances = {};
  this._grunt.task.run("hooks:pre-compile:release");
  this._grunt.log.verbose.ok("Scheduled pre-compile hooks");

  resolved.forEach(function(component) {
    var instance = component.instance;
    instances[instance.name()] = instance;
    instance.handleTarget("release", _this._components);
    _this._grunt.log.verbose.ok(
        "Configured release target for component '" + instance.name() + "'."
    );
  });

  return instances;
};

DistributionBuilder.prototype._packagesTargets = function _packagesTargets(
    packages
) {
  var config  = this._packages;
  var targets = {};

  packages.forEach(function(package) {
    var components = config[package];
    Object.keys(components).forEach(function(component) {
      targets[component] = components[component];
    });
  });

  return targets;
};

DistributionBuilder.prototype._processComponents = function _processComponents(
    packages
) {
  var components = this._getComponents(packages);
  var options    = this._options;

  var instances = this._scheduleTasks(components);
  var targets   = this._packagesTargets(packages);
  this._grunt.log.verbose.ok(
      "Packaging components", components, "with targets", targets
  );

  // Copy output to desired location.
  var grunt = this._grunt;
  components.forEach(function(component) {
    grunt.log.verbose.write(
        "Configuring distribution for " + component + " ... "
    );

    var dest = path.join("out", "packages");
    var src  = instances[component].getOutput("release");

    if (typeof src !== "object") {
      src = { src: src };
    }
    if (options.prefix) {
      dest = path.join(dest, options.prefix);
    }

    grunt.config("copy.distribute\\." + component, {
      options: { mode: true },
      files: [{
          expand: src.expand || false,
          cwd:  src.cwd || ".",
          dest: path.join(dest, targets[component]),
          src:  src.src
      }]
    });

    grunt.task.run("copy:distribute." + component);
    grunt.log.verbose.ok();
  });

  // Bundle pakcages directory if requested.
  // Always return a promise for consisteny.
  var promise = Promise({ archive_name: "packages" });
  if (options.bundle) {
    // Build archive name.
    if (options.bundle.name) {
      promise = promise.then(function() {
        return { archive_name: options.bundle.name };
      });
    }

    // Get the commit sha.
    if (options.bundle.version) {
      promise = get_commit_sha(promise);

      // Shorten the hash if the user wants it.
      if (options.bundle.shorten_version) {
        promise = promise.then(function(continuation) {
          continuation.sha = continuation.sha.substr(0, 7);
          return continuation;
        });
      }
    }

    // Configure grunt.
    promise = promise.then(function(continuation) {
      var name = continuation.archive_name;
      if (continuation.sha) {
        name += "-" + continuation.sha;
      }

      grunt.config("compress.distribute", {
        files: [{
            expand: true,
            cwd:  "out/packages",
            src:  "**"
        }],

        options: {
          archive: "out/" + name + ".tar.gz",
          mode: "tgz"
        }
      });
      grunt.task.run("compress:distribute");
    });
  }

  // Return the promise.
  return promise;
};

DistributionBuilder.prototype.all = function all() {
  var packages = Object.keys(this._packages);
  return this._processComponents(packages);
};

DistributionBuilder.prototype.build = function build(package) {
  return this._processComponents([package]);
};
