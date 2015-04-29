var assert = require("assert");
var mocha  = require("mocha");

var Component = require("../../components/component");


suite("Component", function() {
  suite("Constructor", function() {
    test("fails if configuration is not given", function() {
      var block = function() {
        new Component();
      };
      assert.throws(block, /Invalid component configuration/);
    });

    test("fails if configuration is null", function() {
      var block = function() {
        new Component(null);
      };
      assert.throws(block, /Invalid component configuration/);
    });

    test("fails if grunt is not given", function() {
      var block = function() {
        new Component({ });
      };
      assert.throws(block, /Grunt instance not valid/);
    });

    test("fails if name is not given", function() {
      var block = function() {
        new Component({ grunt: {} });
      };
      assert.throws(block, /Missing component name/);
    });

    test("fails if name is empty", function() {
      var block = function() {
        new Component({
          grunt: {},
          name: ""
        });
      };
      assert.throws(block, /Missing component name/);
    });

    test("passes instenceof checks", function() {
      var component = new Component({
        grunt: {},
        name: "a"
      });
      assert(component instanceof Component);
    });
  });

  suite("Dependency utils", function() {
    test("parse name without target returns default target", function() {
      var dep = Component.parseDependencyName("a", "test");
      assert.strictEqual(dep.name, "a");
      assert.strictEqual(dep.target, "test");
    });

    test("parse name with target returns that target", function() {
      var dep = Component.parseDependencyName("debug.a", "test");
      assert.strictEqual(dep.name, "a");
      assert.strictEqual(dep.target, "debug");
    });

    test("parse name with malformed name fails", function() {
      var block = function() {
        Component.parseDependencyName("a.b.c", "test");
      };
      assert.throws(block, /Cannot parse malformed dependency 'a.b.c'/);
    });

    test("check duplicates fails if a component has two targets", function() {
      var block = function() {
        var components = [{
          name: "a",
          target: "release"
        }, {
          name: "a",
          target: "debug"
        }];
        Component.checkDependenciesList(components);
      };
      assert.throws(block, /Ambiguous dependency for component 'a'/);
    });

    test("check duplicates ignores the same target", function() {
      var components = [{
        name: "a",
        target: "release"
      }, {
        name: "b",
        target: "test"
      }, {
        name: "a",
        target: "release"
      }];
      var result = Component.checkDependenciesList(components);
      assert.deepEqual(result, [{
        name: "a",
        target: "release"
      }, {
        name: "b",
        target: "test"
      }]);
    });
  });

  suite("Dependencies", function() {
    test("fails if the target does not exist", function() {
      var block = function() {
        var component = new Component({ grunt: {}, name: "a" });
        component.dependencies("test");
      };
      assert.throws(block, /Missing target 'test' for 'a'/);
    });

    test("target has the specified dependencies", function() {
      var component = new Component({ name: "a", grunt: {}, targets: {
        test: { deps: ["a", "b", "c"] }
      } });
      assert.deepEqual(component.dependencies("test"), [
        {name: "a", target: "test"},
        {name: "b", target: "test"},
        {name: "c", target: "test"}
      ]);
    });

    test("target gets dependencies from component too", function() {
      var component = new Component({
        grunt: {},
        name:  "a",
        deps:  ["a", "debug.e", "debug.f"],
        targets: {
          test: { deps: ["a", "b", "c"] }
        }
      });
      assert.deepEqual(component.dependencies("test"), [
        {name: "a", target: "test"},
        {name: "e", target: "debug"},
        {name: "f", target: "debug"},
        {name: "b", target: "test"},
        {name: "c", target: "test"}
      ]);
    });
  });

  suite("Targets", function() {
    test("are not present if not specified", function() {
      var component = new Component({ grunt: {}, name: "a" });
      assert.deepEqual(component.targets(), []);
    });

    test("are added if specified in the configuration", function() {
      var component = new Component({
        grunt: {},
        name:  "a",
        targets: {
          release: {},
          test: {}
        }
      });
      assert.deepEqual(component.targets().sort(), ["release", "test"]);
    });

    test("fail to parse if deps is specified but is not an array", function() {
      var block = function() {
        new Component({ grunt: {}, name: "a", targets: {
          test: { deps: "abc" }
        } });
      };
      assert.throws(
          block,
          /If defined, the deps property of target 'test' must be an array/
      );
    });
  });
});
