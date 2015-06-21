var assert = require("assert");
var mocha  = require("../grunt-suite");

var Components = require("../../../components/components");
var ScriptsComponent = require("../../../components/types/scripts");


gruntSuite("Main grunt task", "targets/main", function() {
  setup(function() {
    var components = new Components();
    this.setComponents(components);

    var scripts = { demo: "demo" };
    components.add(new ScriptsComponent({
      grunt: this.grunt,
      name:  "a",
      path:  "a/b/c",
      "clear-path": "a",
      scripts: scripts,
      targets: { test: { tasks: "demo" } }
    }));
    components.add(new ScriptsComponent({
      grunt: this.grunt,
      name:  "b",
      path:  "a/b/c",
      "clear-path": "b",
      scripts: scripts,
      targets: { test: {
        deps: ["a"],
        tasks: "demo"
      } }
    }));
  });

  test("dependencies are schedules too", function() {
    this.grunt.testTask("test");
    this.grunt.task.assertTaskQueue([
      "hooks:pre-compile:test", "shell:test.a.demo", "shell:test.b.demo"
    ]);
  });

  test("target is processed", function() {
    this.grunt.testTask("test", "a");
    this.grunt.task.assertTaskQueue([
      "hooks:pre-compile:test", "shell:test.a.demo"
    ]);
  });
});
