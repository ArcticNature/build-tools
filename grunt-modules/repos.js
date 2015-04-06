module.exports = function(grunt_module, deps) {

  // Configure repository projects.
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "repo");

};
