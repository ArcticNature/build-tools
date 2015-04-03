var path = require("path");
var task_gen   = module.exports = {};
var GCOVR_PATH = path.resolve("build-tools/gcovr");


var get_excludes = function get_excludes(deps, opts, target) {
  var excludes = deps.getExcludes(opts.name, target);
  return excludes.map(function(exclude) {
    return "!" + exclude;
  });
};

var get_includes = function get_includes(deps, opts, target) {
  var includes = deps.resolveIncludes(opts.name, target);
  includes.push(opts.path + "/include");
  return includes;
};

var get_libraries = function get_libraries(deps, opts, target) {
  return deps.resolveLibraries(opts.name, target);
};

var get_static_libraries = function get_static_libraries(deps, opts, target) {
  return deps.resolveStaticLibraries(opts.name, target);
};

// Keep track of all dependencies seen across all tasks.
var all_seen_deps = {};
var tasks_runner = function tasks_runner(grunt, deps, name, target, tasks) {
  return function() {
    var task_deps = deps.resolveTasks(name, target);
    task_deps = task_deps.filter(function(task) {
      var parts = task.split(".");
      var name  = parts[1];
      var seen  = all_seen_deps[name] || false;
      all_seen_deps[name] = true;
      return !seen;
    });

    if (task_deps.length > 0) {
      grunt.task.run(task_deps);
      grunt.log.ok("Queued main task dependencies.");
    }

    grunt.task.run(tasks);
    grunt.log.ok("Queued tasks.");
  };
};


/*! Configures tasks for binary targets. */
var configure_bin_type = function configure_bin_type(
    deps, grunt_module, name, opts, target, tasks
) {
  var objects = ["out/build/" + target + "/" + opts.path + "/**/*.o"];
  objects.push.apply(objects, get_static_libraries(deps, opts, target));

  grunt_module.configure("link++", name, {
    libs:  get_libraries(deps, opts, target),
    files: [{
        dest: "out/dist/" + target + "/" + opts.path + "/" + opts.name,
        src:  objects
    }]
  });

  tasks.push("link++:" + name);
};

/*! Configures tasks for static library targets. */
var configure_lib_type = function configure_lib_type(
    deps, grunt_module, name, opts, target, tasks
) {
  grunt_module.configure("ar", name, {
    files: [{
        dest: "out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a",
        src:  "out/build/" + target + "/" + opts.path + "/**/*.o"
    }]
  });

  grunt_module.configure("ranlib", name, {
    files: [{
        dest: "out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a",
        src:  "out/build/" + target + "/" + opts.path + "/**/*.o"
    }]
  });

  tasks.push("ar:" + name, "ranlib:" + name);
};

var COFIG_BY_TYPE = {
  bin: configure_bin_type,
  lib: configure_lib_type
};


/*!
 * Generates clean tasks for a module.
 * 
 * The following tasks are added:
 *   * clean:{name}          Run all clean tasks for the component.
 *   * clean:{name}.build    Clean object files for the component.
 *   * clean:{name}.dist     Clean target files for the component.
 *   * clean:{name}.jenkins  Clean metrics-related reports.
 *   
 * The following tasks are extended:
 *   * clean.build    Run debug clean task for all components.
 *   * clean.dist     Run dist clean task for all components.
 *   * clean.jenkins  Run jenkin clean task for all components.
 */
task_gen.configure_clean = function configure_clean(grunt_module, names, opts) {
  grunt_module.configure("clean", names.build, [
    "out/build/debug/"   + opts.path,
    "out/build/release/" + opts.path,
    "out/build/test/"    + opts.path
  ]);
  grunt_module.configure("clean", names.dist, [
    "out/dist/debug/"   + opts.path,
    "out/dist/release/" + opts.path,
    "out/dist/test/"    + opts.path
  ]);
  grunt_module.configure("clean", names.jnkns, "out/reports/" + opts.path);

  grunt_module.aliasMore("clean.build",   "clean:" + names.build);
  grunt_module.aliasMore("clean.dist",    "clean:" + names.dist);
  grunt_module.aliasMore("clean.jenkins", "clean:" + names.jnkns);
  grunt_module.alias("clean." + opts.name, [
    "clean:" + names.build,
    "clean:" + names.dist,
    "clean:" + names.jnkns
  ]);
};

/*!
 * Generates debug/release/test tasks for C++ projects.
 * 
 * The following tasks are added:
 *   * {target}.{name} Build {target} version of the component.
 *
 * The following tasks are extended:
 *   * {target} Run all {target} tasks for all components.
 */
task_gen.configure_cxx_target = function configure_cxx_target(
    target, grunt_module, name, opts, deps
) {
  var tasks = ["g++:" + name];
  var src   = [opts.path + "/src/**/*.cpp"];
  src.push.apply(src, get_excludes(deps, opts, target));

  grunt_module.configure("g++", name, {
    coverage: target === "test",
    include:  get_includes(deps, opts, target),
    objects_path: "out/build/" + target,
    src: src
  });

  var target_type = deps.getTypeForTarget(opts.name, target);
  var type_config = COFIG_BY_TYPE[target_type];
  if (type_config) {
    type_config(deps, grunt_module, name, opts, target, tasks);
  }

  grunt_module.aliasMore(target, target + "." + opts.name);
  grunt_module.alias(target + "." + opts.name, tasks_runner(
      grunt_module.getGrunt(), deps, opts.name, target, tasks
  ));
};

/*!
 * Generates jenkins tasks.
 * These tasks run tests, compute coverage, linsts and analisis the component.
 * 
 * The following tasks are added:
 *   * jenkins.{name} Build test version and runs reports on it.
 *
 * The following tasks are extended:
 *   * jenkins Run all jenkins tasks for all components.
 */
task_gen.configure_jenkins = function configure_jenkins(
    grunt_module, names, opts, deps, skip_tests
) {
  // Test coverage.
  grunt_module.configure("gcovr", opts.name, {
    exclude: ".*(3rd-parties|tests).*",
    gcovr:   GCOVR_PATH,
    objects: "out/build/test/" + opts.path + "/src",
    save_to: "out/reports/" + opts.path + "/coverage.xml"
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

  var tasks = ["clean:" + names.jnkns];
  if (!skip_tests) {
    tasks.push(
        "test."  + opts.name,
        "gcovr:" + opts.name
    );
  }
  tasks.push(
      "cpplint:"  + opts.name,
      "cppcheck:" + opts.name
  );

  // Aliases.
  grunt_module.aliasMore("jenkins", "jenkins." + opts.name);
  grunt_module.alias("jenkins." + opts.name, tasks);
};

/*!
 * Generates test tasks for a module..
 * 
 * The following tasks are added:
 *   * test.{name} Build tests for the component and runs them.
 *
 * The following tasks are extended:
 *   * test Run all test tasks for all components.
 */
task_gen.configure_test = function configure_test(
    grunt_module, names, opts, deps
) {
  var objects = ["out/build/test/" + opts.path + "/**/*.o"];
  var src = [
    opts.path + "/src/**/*.cpp",
    opts.path + "/tests/**/*.cpp"
  ];

  objects.push.apply(objects, get_static_libraries(deps, opts, "test"));
  src.push.apply(src, get_excludes(deps, opts, "test"));

  grunt_module.configure("link++", names.test, {
    libs:  get_libraries(deps, opts, "test"),
    files: [{
        dest: "out/dist/test/" + opts.path + "/test",
        src:  objects
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
    src: src
  });

  grunt_module.configure("shell", names.test, {
    command: (
        "out/dist/test/" + opts.path + "/test --gtest_output='xml:" +
        "out/reports/" + opts.path + "/test-results.xml'"
    )
  });

  grunt_module.aliasMore("test", "test." + opts.name);
  grunt_module.alias("test." + opts.name, tasks_runner(
      grunt_module.getGrunt(), deps, opts.name, "test", [
        "g++:"    + names.test,
        "g++:"    + names.test + ".gtest",
        "link++:" + names.test,
        "shell:"  + names.test
      ]
  ));
};