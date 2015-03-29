module.exports = function(grunt_module) {

  require("../utils/cpp-module")(grunt_module, {
    code: "logging/snow-fox-logging/",
    name: "logging",
    path: "netbeans-projects/logging/snow-fox-logging/"
  });

};
