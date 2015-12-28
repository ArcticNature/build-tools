var assert = require("assert");
var mocha  = require("mocha");

var GruntMock = require("../../grunt-mock");
var TemplatesComponent = require("../../../components/types/templates");


suite("TemplatesComponent", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.make = function make(config) {
      config = Object.create(config);
      config.grunt = grunt;
      config.name  = "test";
      config.path  = "/test";
      config["clear-path"] = config["clear-path"] || "/clear/path";
      return new TemplatesComponent(config);
    };

    this.grunt.file.set_files({
      "/test/defaults.json": JSON.stringify({
        name:  "test",
        debug: true
      }),
      "/test/template.data": JSON.stringify({
        extra: 1
      }),
      "/test/data.data": JSON.stringify({
        debug: false,
        extra: 1
      })
    });
  });

  test("clear path", function() {
    var component = this.make({ templates: {
      "template.h": {},
      "t2": {},
      "temp/late/three": {}
    } });

    assert.deepEqual(component.getCleanPath("debug"), "out/debug/test");
  });

  test("get c++ headers", function() {
    var component = this.make({ templates: {
      "include/template.h": {},
      "t2": {},
      "temp/late/three.h": {}
    } });

    assert.deepEqual(component.getCppHeaders("debug"), [
      "out/debug/test/include"
    ]);
  });

  test("get output files", function() {
    var component = this.make({ templates: {
      "template.h": {},
      "t2": {},
      "temp/late/three.h": {}
    } });

    assert.deepEqual(component.getOutput("debug"), {
      expand: true,
      src: [
        "out/debug/test/template.h",
        "out/debug/test/t2",
        "out/debug/test/temp/late/three.h"
      ]
    });
  });

  suite("Expand", function() {
    test("using defaults", function() {
      var component = this.make({
        defaults: "defaults.json",
        templates: {
          "template.h": "template.hbs",
          "temp/late/data": "data.hbs"
        }
      });

      component.handleTarget("debug");
      this.grunt.task.assertTaskQueue([
        "handlebars:test.debug.template.h",
        "handlebars:test.debug.temp/late/data"
      ]);
      
      assert.deepEqual(
        this.grunt.config("handlebars.test\\.debug\\.template\\.h"), {
          files: [{
            src:  "/test/template.hbs",
            dest: "out/debug/test/template.h"
          }],
          options: { data: {
            __BUILD_TARGET__: "debug",
            name: "test",
            debug: true
          } }
        }
      );

      assert.deepEqual(
        this.grunt.config("handlebars.test\\.debug\\.temp/late/data"), {
          files: [{
            src:  "/test/data.hbs",
            dest: "out/debug/test/temp/late/data"
          }],
          options: { data: {
            __BUILD_TARGET__: "debug",
            name: "test",
            debug: true
          } }
        }
      );
    });

    test("merging defaults and target", function() {
      var component = this.make({
        defaults: "defaults.json",
        templates: {
          "template.h": "template.hbs"
        },

        targets: {
          debug: { data: {
            "template.h": "template.data"
          } }
        }
      });

      component.handleTarget("debug");
      this.grunt.task.assertTaskQueue([
        "handlebars:test.debug.template.h"
      ]);
      
      assert.deepEqual(
        this.grunt.config("handlebars.test\\.debug\\.template\\.h"), {
          files: [{
            src:  "/test/template.hbs",
            dest: "out/debug/test/template.h"
          }],
          options: { data: {
            __BUILD_TARGET__: "debug",
            name: "test",
            debug: true,
            extra: 1
          } }
        }
      );
    });

    test("override default with data", function() {
      var component = this.make({
        defaults: "defaults.json",
        templates: {
          "template.h": "template.hbs"
        },

        targets: {
          debug: { data: {
            "template.h": "data.data"
          } }
        }
      });

      component.handleTarget("debug");
      this.grunt.task.assertTaskQueue([
        "handlebars:test.debug.template.h"
      ]);
      
      assert.deepEqual(
        this.grunt.config("handlebars.test\\.debug\\.template\\.h"), {
          files: [{
            src:  "/test/template.hbs",
            dest: "out/debug/test/template.h"
          }],
          options: { data: {
            __BUILD_TARGET__: "debug",
            name: "test",
            debug: false,
            extra: 1
          } }
        }
      );
    });
  });
});
