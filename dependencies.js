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
  name: "posix",
  path: "posix/snow-fox-posix",
  deps: ["exceptions"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      type: "test"
    }
  }

}, {
  name: "utils",
  path: "core/snow-fox-utils",
  deps: ["exceptions"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
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
