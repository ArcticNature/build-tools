var path = require("path");


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
  var tasks = ["g++:" + name];
  grunt_module.configure("g++", name, {
    coverage: target === "test",
    include:  get_includes(deps, opts, target),
    objects_path: "out/build/" + target,
    src: [opts.path + "/src/**/*.cpp"]
  });

  grunt_module.configure("ar", name, {
    files: [{
        dest: "out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a",
        src:  "out/build/" + target + "/" + opts.path + "/**/*.o"
    }]
  });

  grunt_module.configure("shell", name + ".ranlib", {
    command: (
        "ranlib out/dist/" + target + "/" + opts.path + "/" + opts.name + ".a"
    )
  });
  tasks.push("ar:" + name, "shell:" + name + ".ranlib");

  grunt_module.aliasMore(target, target + ":" + opts.name);
  grunt_module.alias(target + ":" + opts.name, tasks_runner(
      grunt_module.getGrunt(), deps, opts.name, target, tasks
  ));
};

var configure_jenkins = function configure_jenkins(
    grunt_module, names, opts, deps
) {
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
    "cpplint:"  + opts.name,
    "cppcheck:" + opts.name
  ]);
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

var tasks_runner = function tasks_runner(grunt, deps, name, target, tasks) {
  return function() {
    grunt.task.run(deps.resolveTasks(name, target));
    grunt.log.ok("Queued main task dependencies.");

    grunt.task.run(tasks);
    grunt.log.ok("Queued tasks.");
  };
};

module.exports = function(grunt_module, deps) {
  var opts = deps.getProjectMetadata("testing");

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
    debug: opts.name + ".debug"
  };

  // Request modules.
  grunt_module.loadTasks("build-tools/grunt-tasks");
  grunt_module.loadTasks("build-tools/grunt-tasks/c++");
  grunt_module.loadNpmTasks("grunt-contrib-clean");
  grunt_module.loadNpmTasks("grunt-shell");

  // Configure tasks.
  configure_clean(grunt_module, names, opts);
  configure_cxx_target("debug", grunt_module, names.debug, opts, deps);
  configure_jenkins(grunt_module, names, opts, deps);
};
