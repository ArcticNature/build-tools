module.exports = function(grunt_module, deps) {

  // Configure serialiser projects.
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "serialiser");
  configure(grunt_module, deps, "serialiser-json");

};
