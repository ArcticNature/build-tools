/**
 * Extends Mocha TDD ui with the gruntSuite method for testing Grunt tasks.
 */
var mocha = module.exports = require("mocha");
var GruntMock = require("../grunt-mock");


global.gruntSuite = function gruntSuite(name, path, callback) {
  suite(name, function() {
    setup(function() {
      this.grunt  = new GruntMock();
      this.module = require("../../grunt-tasks/" + path);
      this.module(this.grunt);

      var _this = this;
      this.setComponents = function setComponents(components) {
        _this.grunt.config.set("get-components", function() {
          return components;
        });
      };
    });

    callback.call(this);
  });
};
