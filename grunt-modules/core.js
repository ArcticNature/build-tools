module.exports = function(grunt_module, deps) {

  // Configure core projects (ordered by dependency).
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "exceptions");
  configure(grunt_module, deps, "posix");
  configure(grunt_module, deps, "utils");
  configure(grunt_module, deps, "logging");
  configure(grunt_module, deps, "state");

  // Extentions to core.
  configure(grunt_module, deps, "user-posix");

};
