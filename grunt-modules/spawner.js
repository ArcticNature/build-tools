module.exports = function(grunt_module, deps) {

  // Configure spawner projects (ordered by dependency).
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "spawner-channel");
  configure(grunt_module, deps, "spawner-connector");

};
