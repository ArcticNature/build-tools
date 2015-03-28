var child_process = require("child_process");
var fs = require("fs");
var Q  = require("q");


var throw_error = function throw_error(message) {
  throw new Error(message);
};


var SubProcess = module.exports = function SubProcess(options) {
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
  var child = child_process.spawn(this._cmd, this._args, {
    cwd:   this._cwd,
    stdio: stdio
  });

  // Listen for exit event and resolve promise.
  var promise = Q.defer();
  child.on("exit", function(code, signal) {
    if (code === 0) {
      promise.resolve();
    } else {
      promise.reject(code || signal);
    }
  });
  return promise.promise;
};
