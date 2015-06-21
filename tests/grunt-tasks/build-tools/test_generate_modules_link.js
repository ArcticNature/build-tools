var assert = require("assert");
var mocha  = require("../grunt-suite");

var Component    = require("../../../components/component");
var Components   = require("../../../components/components");
var CppComponent = require("../../../components/types/c++");

var EXPECTED_PATH = "daemon/daemon/src/plugins/initialise_extensions.cpp";


var assert_ends_with = function assert_starts_with(text, expected) {
  var expected_start = text.length - expected.length;
  var actual = text.substr(expected_start);
  assert.equal(actual, expected);
};

var assert_starts_with = function assert_starts_with(text, expected) {
  var actual = text.substr(0, expected.length);
  assert.equal(actual, expected);
};


gruntSuite(
    "Generate modules link", "build-tools/generate-modules-link",
    function() {
  setup(function() {
    var components = new Components();
    this.setComponents(components);

    components.add(new Component({
      grunt: this.grunt,
      name:  "a",
      path:  "a",
      targets: { test: {} },
      "module-type": "core"
    }));

    components.add(new Component({
      grunt: this.grunt,
      name:  "b",
      path:  "b",
      targets: { test: {} },
      "module-type": "core-extension"
    }));

    // This test case checks for special symbol -
    components.add(new Component({
      grunt: this.grunt,
      name:  "c-d",
      path:  "c",
      targets: { test: {} },
      "module-type": "extension"
    }));
    
    components.add(new CppComponent({
      grunt: this.grunt,
      name:  "daemon",
      path:  "daemon/daemon",
      deps:  ["a", "b", "c-d"],
      targets: { test: {} }
    }));
  });

  test("both extensions and core extensions are added", function() {
    var expected = [
      this.module.LINE_TEMPLATE.replace("{name}", "b"),
      this.module.LINE_TEMPLATE.replace("{name}", "c_d")
    ].join('\n');

    this.grunt.testTask("generate-modules-link", "test");
    var content = this.grunt.file.wrote[EXPECTED_PATH] || "";
    var actual  = content.substr(
        this.module.HEADER.length,
        content.length - this.module.HEADER.length - this.module.FOOTER.length
    );

    assert.equal(actual, expected);
  });

  test("correct footer is generated", function() {
    this.grunt.testTask("generate-modules-link", "test");
    var content = this.grunt.file.wrote[EXPECTED_PATH] || "";
    assert_ends_with(content, this.module.FOOTER);
  });

  test("correct header is generated", function() {
    this.grunt.testTask("generate-modules-link", "test");
    var content = this.grunt.file.wrote[EXPECTED_PATH] || "";
    assert_starts_with(content, this.module.HEADER);
  });

  test("does not write to file if there are no differences", function() {
    var files = {};
    files[EXPECTED_PATH] = (
        this.module.HEADER +
        this.module.LINE_TEMPLATE.replace("{name}", "b") + '\n' +
        this.module.LINE_TEMPLATE.replace("{name}", "c_d") +
        this.module.FOOTER
    );

    this.grunt.file.set_files(files);
    this.grunt.testTask("generate-modules-link", "test");
    this.grunt.file.assert_did_not_write(EXPECTED_PATH);
  });

  test("path is computed correctly", function() {
    this.grunt.testTask("generate-modules-link", "test");
    this.grunt.file.assert_wrote_to_path(EXPECTED_PATH);
  });
});
