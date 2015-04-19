module.exports = function(grunt_module, deps) {

  // Configure service projects.
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "service");
  configure(grunt_module, deps, "service-local");

};
