var assert = require("assert");
var mocha  = require("../grunt-suite");

//var Component  = require("../../../components/component");
var Components   = require("../../../components/components");
var CppComponent = require("../../../components/c++");


gruntSuite("Clear grunt task", "targets/clear", function() {
  setup(function() {
    var components = new Components();
    this.setComponents(components);

    components.add(new CppComponent({
      name: "a",
      path: "a/b/c",
      targets: {
        debug:   {},
        release: {}
      }
    }));
    components.add(new CppComponent({
      name: "b",
      path: "a/b/c",
      targets: { test: {} }
    }));
  });

  test("clean tasks are added for all components", function() {
    this.grunt.testTask("clear");

    assert.equal(
        this.grunt.config.get("clean.a\\.debug"),
        "out/*/debug/a/b/c"
    );
    assert.equal(
        this.grunt.config.get("clean.a\\.release"),
        "out/*/release/a/b/c"
    );
    assert.equal(
        this.grunt.config.get("clean.b\\.test"),
        "out/*/test/a/b/c"
    );
  });

  test("clean tasks are added for specific component", function() {
    this.grunt.testTask("clear", "a");

    assert.equal(
        this.grunt.config.get("clean.a\\.debug"),
        "out/*/debug/a/b/c"
    );
    assert.equal(
        this.grunt.config.get("clean.a\\.release"),
        "out/*/release/a/b/c"
    );
  });

  test("clean task is added for specific component and target", function() {
    this.grunt.testTask("clear", "a", "release");

    assert.equal(this.grunt.config.get("clean.a\\.debug"), null);
    assert.equal(
        this.grunt.config.get("clean.a\\.release"),
        "out/*/release/a/b/c"
    );
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
