var assert = require("assert");
var mocha  = require("../grunt-suite");

var Components   = require("../../../components/components");
var CppComponent = require("../../../components/types/c++");


gruntSuite("Clear grunt task", "targets/clear", function() {
  setup(function() {
    var components = new Components();
    this.setComponents(components);

    components.add(new CppComponent({
      grunt: this.grunt,
      name:  "a",
      path:  "a/b/c",
      targets: {
        debug:   {},
        release: {}
      }
    }));
    components.add(new CppComponent({
      grunt: this.grunt,
      name:  "b",
      path:  "a/b/c",
      targets: { test: {} }
    }));
  });

  test("clean tasks are added for all components", function() {
    this.grunt.testTask("clear");

    assert.deepEqual(
        this.grunt.config.get("clean.a\\.debug"),
        ["out/build/debug/a/b/c", "out/dist/debug/a/b/c"]
    );
    assert.deepEqual(
        this.grunt.config.get("clean.a\\.release"),
        ["out/build/release/a/b/c", "out/dist/release/a/b/c"]
    );
    assert.deepEqual(
        this.grunt.config.get("clean.b\\.test"),
        ["out/build/test/a/b/c", "out/dist/test/a/b/c"]
    );
    this.grunt.task.assertTaskQueue([
      "clean:a.debug",
      "clean:a.release",
      "clean:b.test",
      "clean:out-dir",
      "hooks:post-clear"
    ]);
  });

  test("clean tasks are added for specific component", function() {
    this.grunt.testTask("clear", "a");

    assert.deepEqual(
        this.grunt.config.get("clean.a\\.debug"),
        ["out/build/debug/a/b/c", "out/dist/debug/a/b/c"]
    );
    assert.deepEqual(
        this.grunt.config.get("clean.a\\.release"),
        ["out/build/release/a/b/c", "out/dist/release/a/b/c"]
    );
    this.grunt.task.assertTaskQueue(["clean:a.debug", "clean:a.release"]);
  });

  test("clean task is added for specific component and target", function() {
    this.grunt.testTask("clear", "a", "release");

    assert.equal(this.grunt.config.get("clean.a\\.debug"), null);
    assert.deepEqual(
        this.grunt.config.get("clean.a\\.release"),
        ["out/build/release/a/b/c", "out/dist/release/a/b/c"]
    );
    this.grunt.task.assertTaskQueue(["clean:a.release"]);
  });

  test("fails if component does not exists", function() {
    var _this = this;
    var block = function() {
      _this.grunt.testTask("clear", "fake-component");
    };
    assert.throws(block, /Missing component 'fake-component'/);
  });

  test("fails if target does not exists", function() {
    var _this = this;
    var block = function() {
      _this.grunt.testTask("clear", "a", "test");
    };
    assert.throws(
        block, /Missing target 'test' for component 'a'/
    );
  });

  test("registers the clear task", function() {
    this.grunt.assertHasTask("clear");
  });
});
