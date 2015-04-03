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
 */
var path = require("path");
var GCOVR_PATH = path.resolve("build-tools/gcovr");


var configure_clean = function configure_clean(grunt_module, names, opts) {
  grunt_module.configure("clean", names.build, "out/build/" + opts.path);
  grunt_module.configure("clean", names.dist,  "out/dist/" + opts.path);
  grunt_module.configure("clean", names.jnkns, "out/reports/" + opts.path);

  grunt_module.aliasMore("clean:build",   "clean:" + names.build);
  grunt_module.aliasMore("clean:dist",    "clean:" + names.dist);
  grunt_module.aliasMore("clean:jenkins", "clean:" + names.jnkns);
  grunt_module.alias("clean:" + opts.name, [
    "clean:" + names.build,
    "clean:" + names.dist,
    "clean:" + names.jnkns
  ]);
};

var configure_cxx_target = function configure_cxx_target(
    target, grunt_module, name, opts, deps
) {
  grunt_module.configure("ar", name, {
    files: [{
        dest: "out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a",
        src:  "out/build/" + target + "/" + opts.path + "/**/*.o"
    }]
  });
  grunt_module.configure("g++", name, {
    coverage: target === "test",
    include:  get_includes(deps, opts, target),
    objects_path: "out/build/" + target,
    src: [opts.path + "/src/**/*.cpp"]
  });

  grunt_module.configure("shell", name + ".ranlib", {
    command: (
        "ranlib out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a"
    )
  });

  grunt_module.aliasMore(target, target + ":" + opts.name);
  grunt_module.alias(target + ":" + opts.name, tasks_runner(
      grunt_module.getGrunt(), deps, opts.name, target, [
        "g++:" + name,
        "ar:"  + name,
        "shell:" + name + ".ranlib"
      ]
  ));
};

var configure_jenkins = function configure_jenkins(
    grunt_module, names, opts, deps
) {
  // Test coverage.
  grunt_module.configure("gcovr", opts.name, {
    exclude: ".*(3rd-parties|tests).*",
    gcovr:   GCOVR_PATH,
    objects: "out/build/test/" + opts.path + "/src",
    save_to: "out/reports/" + opts.path + "coverage.xml"
  });

  // Code style.
  grunt_module.configure("cpplint", opts.name, {
    options: {
      filter: [
        "-runtime/indentation_namespace"
      ],
      root: path.normalize(opts.path + "/include")
    },
    src: [
      opts.path + "/include/**/*.h",
      opts.path + "/src/**/*.cpp"
    ]
  });

  // Static analysis.
  grunt_module.configure("cppcheck", opts.name, {
    exclude: ["3rd-parties", opts.path + "/tests"],
    include: get_includes(deps, opts, "test"),
    save_to: "out/reports/" + opts.path + "/cppcheck.xml",
    src: [
      opts.path + "/include/**/*.h",
      opts.path + "/src/**/*.cpp"
    ]
  });

  // Aliases.
  grunt_module.aliasMore("jenkins", "jenkins:" + opts.name);
  grunt_module.alias("jenkins:" + opts.name, [
    "clean:" + names.jnkns,
    "test:" + opts.name,
    "gcovr:" + opts.name,
    "cpplint:"  + opts.name,
    "cppcheck:" + opts.name
  ]);
};

var configure_test = function configure_test(grunt_module, names, opts, deps) {
  grunt_module.configure("link++", names.test, {
    libs:  ["pthread", "gcov"],
    files: [{
        dest: "out/dist/test/" + opts.path + "/test",
        src:  "out/build/test/" + opts.path + "/**/*.o"
    }]
  });

  grunt_module.configure("g++", names.test + ".gtest", {
    objects_path: "out/build/test/" + opts.path,
    include: ["3rd-parties/include", "3rd-parties/sources/gtest"],
    src: [
      "3rd-parties/sources/gtest/src/gtest-all.cc",
      "3rd-parties/sources/gtest/src/gtest_main.cc"
    ]
  });

  grunt_module.configure("g++", names.test, {
    objects_path: "out/build/test/",
    include: get_includes(deps, opts, "test"),
    src: [
      opts.path + "/src/**/*.cpp",
      opts.path + "/tests/**/*.cpp"
    ]
  });

  grunt_module.configure("shell", names.test, {
    command: (
        "out/dist/test/" + opts.path + "/test --gtest_output='xml:" +
        "out/reports/" + opts.path + "/test-results.xml'"
    )
  });

  grunt_module.aliasMore("test", "test:" + opts.name);
  grunt_module.alias("test:" + opts.name, tasks_runner(
      grunt_module.getGrunt(), deps, opts.name, "test", [
        "g++:"    + names.test,
        "g++:"    + names.test + ".gtest",
        "link++:" + names.test,
        "shell:"  + names.test
      ]
  ));
};

var get_includes = function get_includes(deps, opts, target) {
  var includes = deps.resolveIncludes(opts.name, target);
  includes.push(opts.path + "/include");
  return includes;
};

var tasks_runner = function tasks_runner(grunt, deps, name, target, tasks) {
  return function() {
    if (!deps.__resolved) {
      deps.__resolved = true;
      grunt.task.run(deps.resolveTasks(name, target));
      grunt.log.ok("Queued main task dependencies.");
    }
    grunt.task.run(tasks);
    grunt.log.ok("Queued tasks.");
  };
};


var CppModuleGenerator = module.exports = function CppModuleGenerator(
    grunt_module, deps, name
) {
  var opts = deps.getProjectMetadata(name);

  // Ensure required options are set.
  if (!opts.name) {
    throw new Error("Required name of the component being configured.");
  }
  if (!opts.path) {
    throw new Error("Required path to code root in the 'path' attribute.");
  }

  // Build all names that will me needed during configuration.
  var names = {
    build: opts.name + ".build",
    dist:  opts.name + ".dist",
    jnkns: opts.name + ".jenkins",

    debug:   opts.name + ".debug",
    release: opts.name + ".release",
    test:    opts.name + ".test"
  };

  // Request modules.
  grunt_module.loadTasks("build-tools/grunt-tasks");
  grunt_module.loadTasks("build-tools/grunt-tasks/c++");
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");

  // Configure tasks.
  configure_clean(grunt_module, names, opts);
  configure_cxx_target("debug",   grunt_module, names.debug,   opts, deps);
  configure_cxx_target("release", grunt_module, names.release, opts, deps);
  configure_test(grunt_module, names, opts, deps);
  configure_jenkins(grunt_module, names, opts, deps);

  // Short-hand for release task.
  grunt_module.alias(opts.name, "release:" + opts.name);
};
