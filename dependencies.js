module.exports = [{
  name: "daemon",
  path: "daemon/daemon",
  include: ["3rd-parties/include"],
  libs: ["lua", "gflags"],
  deps: [
    "logging",
    "state",
    "spawner-channel",
    "spawner-connector",
    "user-posix"
  ],
  targets: {
    debug:   { type: "bin" },
    release: { type: "bin" },
    test:    {
      deps: ["debug.testing", "test.version"],
      exclude: ["daemon/daemon/src/main.cpp"],
      include: ["daemon/daemon/tests"],
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
  name: "spawner-connector",
  path: "daemon/spawner/connectors/connector",
  deps: ["spawner-channel"],
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

  // Manually add logging include path to avoid circular dependency.
  include: ["daemon/logging/logging/include"],
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
