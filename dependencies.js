module.exports = [{
  name: "daemon",
  path: "daemon/daemon",
  include: ["3rd-parties/include"],
  libs: ["lua-5.2", "gflags"],
  deps: [
    "logging",
    "state",
    "spawner",
    "user-posix",
    "version"
  ],
  targets: {
    debug:   { type: "bin" },
    release: { type: "bin" },
    test:    {
      deps: ["debug.testing", "test.version"],
      exclude: ["daemon/daemon/src/main.cpp"],
      //include: ["daemon/daemon/tests"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "exceptions",
  path: "daemon/core/exceptions",
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "logging",
  path: "daemon/logging/logging",
  deps: ["utils"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["debug.testing"],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "posix",
  path: "daemon/posix/posix",
  deps: ["exceptions"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "state",
  path: "daemon/core/state",
  deps: ["utils", "version"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["test.version"],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "spawner-channel",
  path: "daemon/spawner/channel",
  deps: ["logging", "posix", "utils"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "spawner",
  path: "daemon/spawner/spawner",
  deps: [
    "exceptions",
    "posix",
    "spawner-connector-local",
    "spawner-logging",
    "utils",
    "version"
  ],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["test.version"],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "spawner-connector",
  path: "daemon/spawner/connectors/connector",
  deps: ["spawner-channel", "spawner-logging"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "spawner-connector-local",
  path: "daemon/spawner/connectors/local",
  deps: ["spawner-connector"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "spawner-logging",
  path: "daemon/spawner/logging",
  deps: ["utils", "logging", "spawner-channel"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "testing",
  path: "daemon/core/testing",
  deps: ["exceptions", "state", "spawner-channel"],

  // Manually add logging include path to avoid circular dependency.
  include: [
    "daemon/logging/logging/include",
    "daemon/daemon/include"
  ],
  targets: {
    debug: { type: "lib" }
  }

}, {
  name: "user-posix",
  path: "daemon/posix/user-posix",
  deps: ["posix"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "utils",
  path: "daemon/core/utils",
  deps: ["exceptions", "posix"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["debug.testing"],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "version",
  path: "daemon/core/version",
  targets: {
    debug:   { type: "include" },
    release: { type: "include" },
    test:    { type: "include" }
  }
}];
