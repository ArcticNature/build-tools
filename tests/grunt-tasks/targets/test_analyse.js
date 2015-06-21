var assert = require("assert");
var mocha  = require("../grunt-suite");

var Components = require("../../../components/components");
var ScriptsComponent = require("../../../components/types/scripts");


gruntSuite("Analyse grunt task", "targets/analyse", function() {
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
      analysis: "demo",
      targets: { test: { tasks: "demo" } }
    }));
    components.add(new ScriptsComponent({
      grunt: this.grunt,
      name:  "b",
      path:  "a/b/c",
      "clear-path": "b",

      scripts: scripts,
      analysis: "demo",
      targets: { test: {
          deps: ["a"],
          tasks: "demo"
      } }
    }));
  });

  test("analyse all components", function() {
    this.grunt.testTask("analyse");
    this.grunt.task.assertTaskQueue([
      "hooks:pre-compile:test",
      "shell:test.a.demo", "shell:analysis.a.demo",
      "shell:test.b.demo", "shell:analysis.b.demo"
    ]);
  });

  test("dependencies are schedules without analysis", function() {
    this.grunt.testTask("analyse", "b");
    this.grunt.task.assertTaskQueue([
      "hooks:pre-compile:test", "shell:test.a.demo",
      "shell:test.b.demo", "shell:analysis.b.demo"
    ]);
  });

  test("target is build and analysed", function() {
    this.grunt.testTask("analyse", "a");
    this.grunt.task.assertTaskQueue([
      "hooks:pre-compile:test", "shell:test.a.demo",
      "shell:analysis.a.demo"
    ]);
  });
});
