module.exports = [{
  name: "exceptions",
  path: "snow-fox-exceptions",
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      type: "test"
    }
  }

}, {
  name: "logging",
  path: "logging/snow-fox-logging",
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
  path: "posix/snow-fox-posix",
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
  path: "core/snow-fox-testing",

  // Manually add logging include path to avoid circular dependency.
  include: ["logging/snow-fox-logging/include"],
  targets: {
    debug: { type: "lib" }
  }
}, {
  name: "utils",
  path: "core/snow-fox-utils",
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
