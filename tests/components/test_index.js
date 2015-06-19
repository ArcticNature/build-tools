var assert = require("assert");
var mocha  = require("mocha");

var Component  = require("../../components/component");
var Components = require("../../components/components");
var Index = require("../../components");

var GruntMock = require("../grunt-mock");


var assert_enabled_state = function assert_enabled_state(components, en, di) {
  (en || []).forEach(function(name) {
    var component = components.get(name);
    assert(component.enabled(), "Excpected " + name + " to be enabled.");
  });
  (di || []).forEach(function(name) {
    var component = components.get(name);
    assert(!component.enabled(), "Excpected " + name + " to be disabled.");
  });
};


suite("Components index", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.grunt.file.set_files({
      "build-tools/components-config/disable-b": "b = disabled",
      "build-tools/components-config/missing-d": "d = disabled"
    });

    this._real_load_files = Index.loadFiles;
    Index.loadFiles = function() {
      var components    = new Components();
      var add_component = function(name) {
        components.add(new Component({
          grunt: grunt,
          name:  name,
          "module-type": "extension"
        }));
      };

      add_component("a");
      add_component("b");
      add_component("c");
      return components;
    };
  });

  teardown(function() {
    Index.getComponents._reset();
    Index.loadFiles = this._real_load_files;
  });

  suite("GetComponents", function() {
    test("disabled components are indeed disabled", function() {
      var components = Index.getComponents(this.grunt, "disable-b");
      assert_enabled_state(components, ["a", "c"], ["b"]);
    });

    test("profile file does not exist", function() {
      var components = Index.getComponents(this.grunt, "not-found");
      assert_enabled_state(components, ["a", "b", "c"]);
    });

    test("signleton", function() {
      var ref1 = Index.getComponents(this.grunt, "test");
      var ref2 = Index.getComponents(this.grunt, "test");
      assert.equal(ref1, ref2);
    });

    test("unkown components are ignored", function() {
      var components = Index.getComponents(this.grunt, "missing-d");
      assert_enabled_state(components, ["a", "b", "c"]);
    });
  });
});


suite("Components config parsing", function() {
  setup(function() {
    var grunt = this.grunt = new GruntMock();
    this.grunt.file.set_files({
      "build-tools/components-config/parse-1":  "a = disabled",
      "build-tools/components-config/parse-2":  "a= disabled",
      "build-tools/components-config/parse-3":  "a =disabled",
      "build-tools/components-config/parse-4":  "a=disabled",
      "build-tools/components-config/parse-5":  "a = enabled",
      "build-tools/components-config/parse-6":  "a = other",
      "build-tools/components-config/parse-7":  "a =",
      "build-tools/components-config/parse-8":  "a",
      "build-tools/components-config/empty": "a = disabled\n"
    });

    this._real_load_files = Index.loadFiles;
    Index.loadFiles = function() {
      var components    = new Components();
      var add_component = function(name) {
        components.add(new Component({
          grunt: grunt,
          name:  name,
          "module-type": "extension"
        }));
      };

      add_component("a");
      add_component("b");
      add_component("c");
      return components;
    };
  });

  teardown(function() {
    Index.getComponents._reset();
    Index.loadFiles = this._real_load_files;
  });

  test("enabled", function() {
    var components = Index.getComponents(this.grunt, "parse-5");
    assert_enabled_state(components, ["a", "b", "c"]);
  });

  test("fail if no equal", function() {
    var grunt = this.grunt;
    assert.throws(function() { Index.getComponents(grunt, "parse-8"); },
    /Invalid line 'a'/
    );
  });

  test("fail if no value", function() {
    var grunt = this.grunt;
    assert.throws(function() { Index.getComponents(grunt, "parse-7"); },
    /Invalid line 'a ='/
    );
  });

  test("fail if unrecognised", function() {
    var grunt = this.grunt;
    assert.throws(function() { Index.getComponents(grunt, "parse-6"); },
    /Unrecognised option 'other'/
    );
  });

  test("ignore empty lines", function() {
    var components = Index.getComponents(this.grunt, "empty");
    assert_enabled_state(components, ["b", "c"], ["a"]);
  });

  test("no spaces around =", function() {
    var components = Index.getComponents(this.grunt, "parse-4");
    assert_enabled_state(components, ["b", "c"], ["a"]);
  });

  test("one space after =", function() {
    var components = Index.getComponents(this.grunt, "parse-2");
    assert_enabled_state(components, ["b", "c"], ["a"]);
  });

  test("one space around both sides of =", function() {
    var components = Index.getComponents(this.grunt, "parse-1");
    assert_enabled_state(components, ["b", "c"], ["a"]);
  });
  
  test("one space before =", function() {
    var components = Index.getComponents(this.grunt, "parse-3");
    assert_enabled_state(components, ["b", "c"], ["a"]);
  });
});