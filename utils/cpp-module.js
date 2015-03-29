var path = require("path");
var GCOVR_PATH = path.resolve("build-tools/gcovr");


/**
 * Populates a GrHunter module with tasks related to a C++ project.
 * In this description, {name} refers to the name of the module being
 * configured.
 * 
 * The following tasks are added:
 *   * {name} Build a release version of the component.
 *   * debug:{name}    Build debug version of the component.
 *   * release:{name}  Build release version of the component.
 *   * jenkins:{name}  Run tests and reports for the component.
 *
 *   * clean:{name}          Run all clean tasks for the component.
 *   * clean:{name}.build    Clean object files for the component.
 *   * clean:{name}.dist     Clean target files for the component.
 *   * clean:{name}.jenkins  Clean metrics-related reports.
 *
 *   * make:{name}.debug    Run make Debug for the component.
 *   * make:{name}.release  Run make Release for the component.
 *   * make:{name}.test     Run make Test for the component.
 *   * shell:{name}.test    Run tests binary for the component.
 *
 *   * cppcheck:{name}  Run CppCheck on the component.
 *   * cpplint:{name}   Run CppLint on the component.
 *   * gcovr:{name}     Generate coverage report for the component.
 * 
 * The following tasks are extended:
 *   * debug    Run all debug tasks for all components.
 *   * clean    Run all clean tasks for all components.
 *   * jenkins  Run all tests and reports for all components.
 *
 *   * clean:build    Run debug clean task for all components.
 *   * clean:dist     Run dist clean task for all components.
 *   * clean:jenkins  Run jenkin clean task for all components.
 * 
 * @param {type} grunt_module
 * @param {type} opts
 * @returns {undefined}
 */
var CppModuleGenerator = module.exports = function CppModuleGenerator(
    grunt_module, opts
) {
  // Ensure required options are set.
  if (!opts.code) {
    throw new Error("Required path to code root in the 'code' attribute.");
  }
  if (!opts.name) {
    throw new Error("Required name of the component being configured.");
  }
  if (!opts.path) {
    throw new Error("Required path to project root in the 'path' attribute.");
  }


  // Build all names that will me needed during configuration.
  var names = {
    buid:  opts.name + ".build",
    dist:  opts.name + ".dist",
    jnkns: opts.name + ".jenkins",

    debug:   opts.name + ".debug",
    release: opts.name + ".release",
    test:    opts.name + ".test"
  };


  // Request modules.
  grunt_module.loadTasks("build-tools/grunt-tasks");
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");


  // Clean tasks.
  grunt_module.configure("clean", names.buid,  opts.path + "/build");
  grunt_module.configure("clean", names.dist,  opts.path + "/dist");
  grunt_module.configure("clean", names.jnkns, [
    opts.path + "coverage.xml",
    opts.path + "cppcheck.xml",
    opts.path + "test-results.xml"
  ]);

  grunt_module.aliasMore("clean:build",   "clean:" + names.buid);
  grunt_module.aliasMore("clean:dist",    "clean:" + names.dist);
  grunt_module.aliasMore("clean:jenkins", "clean:" + names.jnkns);
  grunt_module.alias("clean:" + opts.name, [
    "clean:" + names.buid,
    "clean:" + names.dist,
    "clean:" + names.jnkns
  ]);


  // Debug aliases.
  grunt_module.configure("make", names.debug, {
    configuration: "Debug",
    cwd: opts.path
  });
  grunt_module.aliasMore("debug", "debug:" + opts.name);
  grunt_module.alias("debug:" + opts.name, "make:" + names.debug);


  // Jenkins aliases.
  grunt_module.configure("gcovr", opts.name, {
    cwd: opts.path,
    exclude: ".*tests.*",
    gcovr:   GCOVR_PATH,
    objects: "build/Test/GNU-Linux-x86/code/src",
    save_to: opts.path + "coverage.xml"
  });

  grunt_module.configure("cpplint", opts.name, {
    options: {
      filter: [
        "-runtime/indentation_namespace"
      ],
      root: opts.code + "include"
    },
    src: [
      opts.code + "/include/**/*.h",
      opts.code + "/src/**/*.cpp",
      "!" + opts.code + "/include/**/*.template.h"
    ]
  });

  grunt_module.configure("cppcheck", opts.name, {
    exclude: ["3rd-parties", opts.code + "/tests"],
    include: [opts.code + "/include", "3rd-parties/include"],
    save_to: opts.path + "/cppcheck.xml",
    src: [
      opts.code + "/include/**/*.h",
      opts.code + "/src/**/*.cpp",
      "!" + opts.code + "/include/**/*.template.h"
    ]
  });

  grunt_module.aliasMore("jenkins", "jenkins:" + opts.name);
  grunt_module.alias("jenkins:" + opts.name, [
    "clean:" + names.jnkns,
    "make:"  + names.test,
    "shell:" + names.test,
    "gcovr:" + opts.name,
    "cpplint:"  + opts.name,
    "cppcheck:" + opts.name
  ]);


  // Release aliases.
  grunt_module.configure("make", names.release, {
    configuration: "Release",
    cwd: opts.path
  });
  grunt_module.aliasMore("release", "release:" + opts.name);
  grunt_module.alias("release:" + opts.name, "make:" + names.release);


  // Test aliases.
  grunt_module.configure("make", names.test, {
    configuration: "Test",
    cwd: opts.path
  });
  grunt_module.configure("shell", names.test, {
    command: "dist/Test/test --gtest_output='xml:test-results.xml'",
    options: { execOptions: { cwd: opts.path } }
  });

  grunt_module.aliasMore("test", "test:" + opts.name);
  grunt_module.alias("test:" + opts.name, [
    "make:"  + names.test,
    "shell:" + names.test
  ]);


  // Short-hand for release task.
  grunt_module.alias(opts.name, "release:" + opts.name);
};
