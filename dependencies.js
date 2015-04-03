module.exports = [{
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
      deps: ["debug:testing"],
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
  name: "testing",
  path: "daemon/core/testing",

  // Manually add logging include path to avoid circular dependency.
  include: ["daemon/logging/logging/include"],
  targets: {
    debug: { type: "lib" }
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
