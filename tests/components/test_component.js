var assert = require("assert");
var mocha  = require("mocha");

var Component  = require("../../components/component");
var Components = require("../../components/components");


suite("Component", function() {
  suite("Constructor", function() {
    test("fails if colours is not a string", function() {
      var block = function() {
        new Component({
          grunt:  {},
          name:   "a",
          path:   "a",
          colour: 123
        });
      };
      assert.throws(
          block,
          /If defined, the colour property must be an hex colour prefixed by an #./
      );
    });

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

    test("fails if injector is not a list", function() {
      var block = function() {
        new Component({
          grunt: {},
          name: "a",
          inject: "abc"
        });
      };
      assert.throws(block, /Invalid injection list. Array of string required./);
    });

    test("fails if injector is not a list of strings", function() {
      var block = function() {
        new Component({
          grunt: {},
          name: "a",
          inject: ["abc", 0]
        });
      };
      assert.throws(block, /Invalid injection list. Array of string required./);
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
      var dep = Component.parseDependencyName("debug@a", "test");
      assert.strictEqual(dep.name, "a");
      assert.strictEqual(dep.target, "debug");
    });

    test("parse name with malformed name fails", function() {
      var block = function() {
        Component.parseDependencyName("a@b@c", "test");
      };
      assert.throws(block, /Cannot parse malformed dependency 'a@b@c'/);
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
        deps:  ["a", "debug@e", "debug@f"],
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

  suite("Module types", function() {
    setup(function() {
      this.make = function make(type) {
        return new Component({
          grunt: {},
          name:  "a",
          path:  "a",
          "module-type": type
        });
      };
    });

    test("core is always enabled", function() {
      var component = this.make("core");
      component.disable();
      assert(component.enabled());
    });

    test("core-extension is always enabled", function() {
      var component = this.make("core-extension");
      component.disable();
      assert(component.enabled());
    });

    test("extension defaults to enabled", function() {
      var component = this.make("extension");
      assert(component.enabled());
    });

    test("extension can be disabled", function() {
      var component = this.make("extension");
      component.disable();
      assert(!component.enabled());
    });

    test("Unrecognised modes are rejected", function() {
      var _this = this;
      assert.throws(function (){
        _this.make("demo");
      }, /Unrecognised module type 'demo'/);
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

  suite("Graph", function() {
    setup(function() {
      var components = this.components = new Components();

      this.make = function make(name, deps) {
        var conf = {
          colour: "#00000" + name,
          deps:  deps || [],
          grunt: {},
          name:  name,
          path:  "path/" + name,
          targets: {
            test: {}
          }
        };

        var c = new Component(conf);
        components.add(c);
        return c;
      };
    });

    test("without dependencies is empty", function() {
      var a = this.make("a");
      assert.deepEqual(a.graph(this.components, "test"), {
        edges: [],
        nodes: {
          a: { colour: "#00000a", label: "a" }
        }
      });
    });

    test("with dependencies has one edge", function() {
      this.make("a");
      var b = this.make("b", ["a"]);
      assert.deepEqual(b.graph(this.components, "test"), {
        edges: [{
          from: "a",
          to:   "b",
          colour: "#00000b"
        }],
        nodes: {
          a: { colour: "#00000a", label: "a" },
          b: { colour: "#00000b", label: "b" }
        }
      });
    });

    test("with indirect dependencies", function() {
      this.make("a");
      this.make("b", ["a"]);
      var c = this.make("c", ["b"]);
      assert.deepEqual(c.graph(this.components, "test"), {
        edges: [{
          from: "b",
          to:   "c",
          colour: "#00000c"
        }],
        nodes: {
          b: { colour: "#00000b", label: "b" },
          c: { colour: "#00000c", label: "c" }
        }
      });
    });
  });
});
