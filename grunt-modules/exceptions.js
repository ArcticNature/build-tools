module.exports = function(grunt_module) {

  require("../utils/cpp-module-fake")(grunt_module, {
    code: "snow-fox-exceptions/",
    name: "exceptions",
    path: "netbeans-projects/snow-fox-exceptions/"
  });

};
