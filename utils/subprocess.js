var child_process = require("child_process");
var fs = require("fs");
var Q  = require("q");


var throw_error = function throw_error(message) {
  throw new Error(message);
};


var SubProcess = module.exports = function SubProcess(logger, options) {
  options = options || {};
  this._logger = logger;

  this._args = options.args || [];
  this._cmd  = options.cmd  || throw_error("Required option cmd missing.");
  this._cwd  = options.cwd  || undefined;

  // All channels default to pipe.
  this._stdio = [
    options.stdin  || 0,
    options.stdout || 1,
    options.stderr || 2
  ];
};


SubProcess._parallelSpawnAll = function _parallelSpawnAll(processes, silent) {
  var promises = Array.prototype.map.call(processes, function(process) {
    if (silent) {
      return process.spawn().fail(function() { return; });
    }
    return process.spawn();
  });
  return Q.all(promises);
};

SubProcess._sequentialSpawnAll = function _sequentialSpawnAll(
    processes, silent
) {
  var make_closure = function(promise, process) {
    return promise.then(function() {
      if (silent) {
        return process.spawn().fail(function() { return; });
      }
      return process.spawn();
    });
  };

  var promise = processes[0].spawn();
  for (var idx=1; idx < processes.length; idx++) {
    promise = make_closure(promise, processes[idx]);
  }
  return promise;
};

SubProcess.spawnAll = function spawnAll(processes, parallel, silent) {
  if (processes.length === 0) {
    return Q.when(null);
  }
  if (processes.length === 1) {
    return processes[0].spawn();
  }

  if (parallel) {
    return SubProcess._parallelSpawnAll(processes, silent);
  }
  return SubProcess._sequentialSpawnAll(processes, silent);
};


SubProcess.prototype.spawn = function spawn() {
  // Generate stdio array for the new process.
  var stdio = [];
  for (var fd=0; fd<this._stdio.length; fd++) {
    var value = this._stdio[fd];
    if (typeof value === "string") {
      value = fs.openSync(value, "w");
    }
    stdio.push(value);
  }

  // Spawn it.
  this._logger.verbose.writeln(
      "Running %s %s (from directory %s).", this._cmd,
      this._args.join(" "), this._cwd || "."
  );
  var child = child_process.spawn(this._cmd, this._args, {
    cwd:   this._cwd,
    stdio: stdio
  });

  // Listen for exit event and resolve promise.
  var promise = Q.defer();
  var subprocess = this;

  child.on("exit", function(code, signal) {
    if (code === 0) {
      promise.resolve();
    } else {
      subprocess._logger.verbose.error(
          "Command %s %s (from directory %s) failed!", subprocess._cmd,
          subprocess._args.join(" "), subprocess._cwd || "."
      );
      promise.reject(code || signal);
    }
  });
  return promise.promise;
};
