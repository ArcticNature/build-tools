var assert = require("assert");
var mocha  = require("mocha");

var Component = require("../../components/component");
var Components = require("../../components/components");


suite("Components", function() {
  setup(function() {
    this.components = new Components();
  });

  suite("Add components", function() {
    test("fails if called without an argument", function () {
      var components = this.components;
      var block = function () {
        components.add();
      };
      assert.throws(block, /Need a component to add/);
    });

    test("fails if called without a component", function () {
      var components = this.components;
      var block = function () {
        components.add(123);
      };
      assert.throws(block, /Can only add Component instances/);
    });

    test("fails if a component is already in the group", function() {
      var component = new Component({ grunt: {}, name: "a" });
      var components = this.components;
      var block = function() {
        components.add(component);
      };

      components.add(component);
      assert.throws(block, /Component 'a' is already known/);
    });

    test("succeeds", function() {
      var component = new Component({ grunt: {}, name: "a" });
      this.components.add(component);
      assert(this.components.has("a"));
    });
  });

  suite("Dependencies navigation", function() {
    test("fails if component is missing", function() {
      var components = this.components;
      var block = function() {
        components.resolve("a", "test");
      };
      assert.throws(block, /Undefined dependent component 'a'/);
    });
    
    test("fails if dependent component is missing", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["b"] } }
      }));

      var components = this.components;
      var block = function() {
        components.resolve("a", "test");
      };
      assert.throws(block, /Undefined dependent component 'b'/);
    });

    test("fails if target is missing", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: {} }
      }));

      var components = this.components;
      var block = function() {
        components.resolve("a", "debug");
      };

      assert.throws(block, /Missing target 'debug' for 'a'/);
    });

    test("fails on ambiguous target", function() {
      // Add nodes to the graph.
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: {
          test: {},
          debug: {}
        }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["debug.a"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "c",
        targets: { test: { deps: ["a", "b"] } }
      }));

      var components = this.components;
      var block = function() {
        components.resolve("c", "test");
      };
      assert.throws(block, /Ambiguous dependency for component 'a'/);
    });

    test("simple 'b' depends on 'a' is detected", function() {
      // Add nodes to the graph.
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: {} }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["a"] } }
      }));

      var resolved = this.components.resolve("b", "test");
      resolved = resolved.map(function(component) {
        return component.name();
      });

      assert.deepEqual(resolved, ["a", "b"]);
    });

    test("shared dependency 'a' is only added once", function() {
      // Add nodes to the graph.
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: {} }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["a"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "c",
        targets: { test: { deps: ["a", "b"] } }
      }));

      var resolved = this.components.resolve("c", "test");
      resolved = resolved.map(function(component) {
        return component.name();
      });

      assert.deepEqual(resolved, ["a", "b", "c"]);
    });

    test("verify fails if a complex loop is detected", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["b"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["c", "d", "g"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "c",
        targets: { test: {} }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "d",
        targets: { test: {} }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "e",
        targets: { test: { deps: ["f"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "f",
        targets: { test: { deps: ["b"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "g",
        targets: { test: { deps: ["f"] } }
      }));

      var components = this.components;
      var block = function() {
        components.verifyTarget("test");
      };
      assert.throws(block, /Detected mutual dependency between 'b' and 'g'/);
    });

    test("verify fails if a component needs itself", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["a"] } }
      }));

      var components = this.components;
      var block = function() {
        components.verifyTarget("test");
      };
      assert.throws(block, /Detected mutual dependency between 'a' and 'a'/);
    });

    test("verify fails if a dependency is not defined", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["b"] } }
      }));

      var components = this.components;
      var block = function() {
        components.verifyTarget("test");
      };
      assert.throws(block, /Component 'a' needs missing dependency 'b'/);
    });

    test("verify fails if a dependency target is not defined", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["debug.b"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: {} }
      }));

      var components = this.components;
      var block = function() {
        components.verifyTarget("test");
      };
      assert.throws(
          block, /Component 'a' needs missing target 'debug' for dependency 'b'/
      );
    });

    test("verify fails if a simple loop is detected", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: { deps: ["b"] } }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["a"] } }
      }));

      var components = this.components;
      var block = function() {
        components.verifyTarget("test");
      };
      assert.throws(block, /Detected mutual dependency between 'a' and 'b'/);
    });
  });

  suite("Membership test", function () {
    test("fails if called without an argument", function () {
      var components = this.components;
      var block = function () {
        components.has();
      };
      assert.throws(block, /Need a component name to check for/);
    });

    test("fails if called with an empty string", function () {
      var components = this.components;
      var block = function () {
        components.has("");
      };
      assert.throws(block, /Need a component name to check for/);
    });

    test("returns false if a component is not in the group", function () {
      assert(!this.components.has("missing-component-name"));
    });

    test("returns true if a component is in the group", function () {
      this.components._components["found-component-name"] = true;
      assert(this.components.has("found-component-name"));
    });
  });

  suite("Plotting", function() {
    test("empty graph", function() {
      assert.equal(
          this.components.plot("test"),
          "digraph {\n}\n"
      );
    });

    test("one component", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: {} }
      }));

      assert.equal(
          this.components.plot("test"),
          "digraph {\n" +
          "  a\n" +
          "}\n"
      );
    });

    test("one dependnecy", function() {
      this.components.add(new Component({
        grunt: {},
        name:  "a",
        targets: { test: {} }
      }));
      this.components.add(new Component({
        grunt: {},
        name:  "b",
        targets: { test: { deps: ["a"] } }
      }));

      assert.equal(
          this.components.plot("test"),
          "digraph {\n" +
          "  a\n" +
          "  a -> b\n" +
          "}\n"
      );
    });
  });
});
