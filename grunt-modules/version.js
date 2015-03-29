module.exports = function(grunt_module) {

  require("../utils/cpp-module")(grunt_module, {
    code: "snow-fox-version/",
    name: "version",
    path: "netbeans-projects/snow-fox-version/"
  });

};
