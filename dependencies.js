module.exports = [{
  name: "exceptions",
  path: "snow-fox-exceptions",
  deps: ["version"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["test:version"],
      type: "test"
    }
  }
}, {
  name: "utils",
  path: "core/snow-fox-utils",
  deps: ["exceptions"],
  targets: {
    debug:   { type: "lib"  },
    release: { type: "lib"  },
    test:    {
      deps: ["test:version"],
      type: "test"
    }
  }
}, {
  name: "version",
  path: "snow-fox-version",
  targets: {
    debug:   { type: "include" },
    release: { type: "include" },
    test:    { type: "include" }
  }
}];
