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

}, {
  name: "cmd-line-parser-gflags",
  path: "daemon/cmd-line-parsers/gflags",
  libs: ["gflags"],
  deps: ["cmd-line-parser", "exceptions", "repo", "repo-file"],
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


// Configuration projects.
module.exports.push({
  name: "configuration",
  libs: ["lua-5.2"],
  path: "daemon/configuration/configuration",
  deps: [
    "events",
    "events-manager-epoll",
    "events-source-internal",
    "exceptions",
    "logging",
    "state",
    "version"
  ],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["debug.testing", "test.version"],
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
    "cmd-line-parser-gflags",
    "configuration",
    "events",
    "events-manager-epoll",
    "events-source-internal",
    "logging",
    "repo",
    "repo-file",
    "state",
    "service-local",
    "spawner",
    "user-posix",
    "utils",
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
  name: "injector",
  path: "daemon/core/injector",
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
  deps: ["cmd-line-parser", "exceptions", "repo", "state", "spawner-channel"],

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
  name: "events-manager-epoll",
  path: "daemon/events/managers/epoll",
  deps: [
    "configuration", "exceptions", "events",
    "injector", "state"
  ],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["debug.testing"],
      include: ["3rd-parties/include"],
      libs: ["lua-5.2", "pthread", "gcov"],
      type: "test"
    }
  }

}, {
  name: "events-source-internal",
  path: "daemon/events/sources/internal",
  libs: ["lua-5.2"],
  deps: ["configuration", "events", "state"],
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

}, {
  name: "repo-file",
  path: "daemon/repositories/file",
  deps: ["exceptions", "logging", "repo", "state", "version"],
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
  deps: [
    "injector", "logging", "repo", "state",
    "spawner-channel", "utils"
  ],
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

}, {
  name: "service-local",
  path: "daemon/services/local",
  deps: ["configuration", "spawner-connector-local", "service"],
  targets: {
    debug:   { type: "lib" },
    release: { type: "lib" },
    test:    {
      deps: ["state"],
      include: ["3rd-parties/include"],
      libs: ["lua-5.2", "pthread", "gcov"],
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
