module.exports = function(grunt_module, deps) {

  var configure = require("../utils/cpp-module");
  configure(grunt_module, deps, "daemon");
  configure(grunt_module, deps, "cmd-line-parser");
  configure(grunt_module, deps, "cmd-line-parser-gflags");

};
