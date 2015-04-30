var assert = require("assert");
var mocha  = require("mocha");

var GruntMock = require("../../grunt-mock");
var ScriptsComponent = require("../../../components/types/scripts");


suite("ScriptsComponent", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.make = function make(config) {
      config = Object.create(config);
      config.grunt = grunt;
      config.name  = "test";
      config.path  = "/test";
      config["clear-path"] = config["clear-path"] || "/clear/path";
      return new ScriptsComponent(config);
    };
  });

  suite("Constructor", function() {
    test("fails if grunt is missing", function() {
      var block = function() {
        new ScriptsComponent({ name: "a" });
      };
      assert.throws(block, /Grunt instance not valid/);
    });

    test("fails if path is missing", function() {
      var grunt = this.grunt;
      var block = function() {
        new ScriptsComponent({
          name: "a",
          grunt: grunt
        });
      };
      assert.throws(block, /Component path not valid/);
    });

    test("fails if clear-path is missing", function() {
      var grunt = this.grunt;
      var block = function() {
        new ScriptsComponent({
          name:  "a",
          path:  "/path",
          grunt: grunt
        });
      };
      assert.throws(block, /Component clear-path not valid/);
    });
  });

  suite("Clear path", function() {
    test("constant array is returned unchanged", function() {
      var component = this.make({
        "clear-path": ["abc", "def"]
      });
      assert.deepEqual(component.getCleanPath("test"), ["abc", "def"]);
    });

    test("constant string is returned unchanged", function() {
      var component = this.make({
        "clear-path": "abc"
      });
      assert.strictEqual(component.getCleanPath("test"), "abc");
    });

    test("template array is processed", function() {
      var component = this.make({
        "clear-path": ["a<%= path %>b", "c<%= target %>d"]
      });
      assert.deepEqual(component.getCleanPath("debug"), ["a/testb", "cdebugd"]);
    });

    test("template string is processed", function() {
      var component = this.make({
        "clear-path": "<%= path %>"
      });
      assert.strictEqual(component.getCleanPath("test"), "/test");
    });
  });

  suite("Script based shell tasks", function() {
    test("target is mapped to command with arguments", function() {
      var component = this.make({
        scripts: {
          test_cmd: {
            command: "<%= path %>/script",
            arguments: ["a", "<%= target %>"]
          }
        },
        targets: { test: { tasks: "test_cmd" } }
      });

      component.handleTarget("test");
      this.grunt.task.assertTaskQueue(["shell:test.test_cmd"]);
      assert.deepEqual(this.grunt.config("shell.test\\.test_cmd"), {
        command: "/test/script a test"
      });
    });

    test("target is mapped to multiple commands", function() {
      var component = this.make({
        scripts: {
          test_cmd:  "<%= path %>/script",
          other_cmd: "some command"
        },
        targets: { test: { tasks: ["test_cmd", "other_cmd"] } }
      });

      component.handleTarget("test");
      this.grunt.task.assertTaskQueue([
        "shell:test.test_cmd",
        "shell:test.other_cmd"
      ]);

      assert.deepEqual(this.grunt.config("shell.test\\.test_cmd"), {
        command: "/test/script"
      });
      assert.deepEqual(this.grunt.config("shell.test\\.other_cmd"), {
        command: "some command"
      });
    });

    test("target is mapped to simple command", function() {
      var component = this.make({
        scripts: { test_cmd: "<%= path %>/script" },
        targets: { test: { tasks: "test_cmd" } }
      });

      component.handleTarget("test");
      this.grunt.task.assertTaskQueue(["shell:test.test_cmd"]);
      assert.deepEqual(this.grunt.config("shell.test\\.test_cmd"), {
        command: "/test/script"
      });
    });
  });
});
