module.exports = function(grunt_module) {

  require("../utils/cpp-module-fake")(grunt_module, {
    code: "snow-fox-version/",
    name: "version",
    path: "netbeans-projects/snow-fox-version/"
  });

};
