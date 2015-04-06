module.exports = [];


// Command line parsers.
module.exports.push({
  name: "cmd-line-parser",
  path: "daemon/cmd-line-parsers/cmd-line-parser",
  deps: ["exceptions", "repo"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }
});


// Core projects.
module.exports.push({
  name: "daemon",
  path: "daemon/daemon",
  libs: ["lua-5.2", "gflags"],
  deps: [
    "cmd-line-parser",
    "events",
    "events-source-internal",
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
      include: ["3rd-parties/include"],
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
  name: "state",
  path: "daemon/core/state",
  deps: [
    "logging", "spawner-channel", "utils",
    "serialiser-json", "version"
  ],
  include: [
    "daemon/cmd-line-parsers/cmd-line-parser/include",
    "daemon/events/core/include",
    "daemon/repositories/repository/include",
    "daemon/services/service/include"
  ],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: [
        "test.version", "repo", "service"
      ],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "testing",
  path: "daemon/core/testing",
  deps: ["exceptions", "repo", "state", "spawner-channel"],

  // Manually add logging include path to avoid circular dependency.
  include: [
    "daemon/logging/logging/include",
    "daemon/cmd-line-parsers/cmd-line-parser/include"
  ],
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
});


// Events projects.
module.exports.push({
  name: "events",
  path: "daemon/events/core",
  deps: [
    "exceptions",
    "spawner-channel",
    "serialiser",
    "serialiser-json",
    "service",
    "state",
    "user-posix",
    "utils"
  ],
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
  name: "events-source-internal",
  path: "daemon/events/sources/internal",
  deps: ["events", "state"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

});


// Logging projects.
module.exports.push({
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

});


// Posix projects.
module.exports.push({
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

});


// Repository projects.
module.exports.push({
  name: "repo",
  path: "daemon/repositories/repository",
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

});


// Serialisers projects.
module.exports.push({
  name: "serialiser",
  path: "daemon/serialisers/serialiser",
  deps: ["posix", "user-posix", "utils"],
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
  name: "serialiser-json",
  path: "daemon/serialisers/json",
  include: ["3rd-parties/include"],
  deps: ["serialiser"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

});


// Service projects.
module.exports.push({
  name: "service",
  path: "daemon/services/service",
  include: ["daemon/core/state/include"],
  deps: ["logging", "repo", "spawner-channel", "utils"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["state"],
      include: ["3rd-parties/include"],
      libs: ["pthread", "gcov"],
      type: "test"
    }
  }

});


// Spawner projects.
module.exports.push({
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

});
