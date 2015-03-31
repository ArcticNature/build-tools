module.exports = function(grunt_module) {

  require("../utils/cpp-module-fake")(grunt_module, {
    code: "snow-fox-utils/",
    name: "utils",
    path: "netbeans-projects/snow-fox-utils/"
  });

};
