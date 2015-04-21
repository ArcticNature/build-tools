module.exports = function(grunt_module, deps) {

  // Configure events projects.
  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "events");
  configure(grunt_module, deps, "events-service");
  configure(grunt_module, deps, "events-manager-epoll");
  configure(grunt_module, deps, "events-source-internal");
  configure(grunt_module, deps, "events-source-tcp");

};
