var assert = require("assert");
var mocha  = require("mocha");
var Git    = require("nodegit");

var Components   = require("../components/components");
var CppComponent = require("../components/types/c++");
var NodeJsComponent = require("../components/types/nodejs");

var DistributionBuilder = require("../distribute");
var GruntMock = require("./grunt-mock");


suite("DistributionBuilder", function() {
  setup(function() {
    this.components = new Components();
    this.grunt = new GruntMock();

    // Components:
    //   lib  (c++ lib)
    //   cli  (nodejs)  <- lib
    //   core (c++ bin) <- lib
    //   docs (script)
    this.components.add(new CppComponent({
      name: "lib",
      path: "code/lib",
      grunt: this.grunt,
      targets: { release: { type: "lib" } }
    }));
    this.components.add(new NodeJsComponent({
      name: "cli",
      path: "code/cli",
      grunt: this.grunt,
      targets: { release: { } },
      deps: ["lib"]
    }));
    this.components.add(new CppComponent({
      name: "core",
      path: "code/core",
      grunt: this.grunt,
      targets: { release: { type: "bin" } },
      deps: ["lib"]
    }));

    // Distribution configuration.
    this.packages = {
      bin: {
        core: "bin/core",
        cli:  "clients/bin/cli"
      },
      cli:  { cli:  "clients/bin/cli" },
      core: { core: "bin/core" },
      lib:  { lib:  "lib/lib" }
    };
    this.options = {};

    // Ready.
    this.builder = new DistributionBuilder(
        this.components, this.packages,
        this.options, this.grunt
    );
  });

  test("needed are listed", function() {
    var components = this.builder._getComponents(["bin"]);
    assert.deepEqual(components, [
      "core", "cli"
    ]);
  });

  test("needed are listed only once", function() {
    var components = this.builder._getComponents(["bin", "cli", "lib"]);
    assert.deepEqual(components, [
      "core", "cli", "lib"
    ]);
  });

  test("release tasks are scheduled", function() {
    this.builder._scheduleTasks(["cli", "core"]);
    this.grunt.task.assertTaskQueue([
      "clean:distribute",
      "hooks:pre-compile:release",
      "g++:release.lib.core",
      "ar:release.lib.lib",
      "copy:release.cli",
      "g++:release.core.core",
      "link++:release.core.bin"
    ]);
  });

  test("target directory is cleared", function() {
    var grunt = this.grunt;
    return this.builder.build("core").then(function() {
      assert.deepEqual(
          grunt.config("clean.distribute"),
          ["out/packages"]
      );
    });
  });

  suite("bin", function() {
    setup(function() {
      return this.builder.build("core");
    });

    test("schedules copy", function() {
      this.grunt.task.assertTaskQueue([
        "clean:distribute",
        "hooks:pre-compile:release",
        "g++:release.lib.core",
        "ar:release.lib.lib",
        "g++:release.core.core",
        "link++:release.core.bin",
        "copy:distribute.core"
      ]);
    });

    test("copies executable", function() {
      assert.deepEqual(this.grunt.config("copy.distribute\\.core"), {
        mode:  true,
        files: [{
            expand: false,
            cwd:  ".",
            dest: "out/packages/bin/core",
            src:  "out/dist/release/code/core/core"
        }]
      });
    });
  });

  suite("lib", function() {
    setup(function() {
      return this.builder.build("lib");
    });

    test("schedules copy", function() {
      this.grunt.task.assertTaskQueue([
        "clean:distribute",
        "hooks:pre-compile:release",
        "g++:release.lib.core",
        "ar:release.lib.lib",
        "copy:distribute.lib"
      ]);
    });

    test("copies static object", function() {
      assert.deepEqual(this.grunt.config("copy.distribute\\.lib"), {
        mode:  true,
        files: [{
            expand: false,
            cwd:  ".",
            dest: "out/packages/lib/lib",
            src:  "out/dist/release/code/lib/lib.a"
        }]
      });
    });
  });

  suite("nodejs", function() {
    setup(function() {
      return this.builder.build("cli");
    });

    test("schedules copy", function() {
      this.grunt.task.assertTaskQueue([
        "clean:distribute",
        "hooks:pre-compile:release",
        "g++:release.lib.core",
        "ar:release.lib.lib",
        "copy:release.cli",
        "copy:distribute.cli"
      ]);
    });

    test("copies module", function() {
      assert.deepEqual(this.grunt.config("copy.distribute\\.cli"), {
        mode:  true,
        files: [{
            expand: true,
            cwd:  "out/dist/release/code/cli/module",
            dest: "out/packages/clients/bin/cli",
            src:  "**"
        }]
      });
    });
  });

  suite("options", function() {
    test("global prefix is applied to output", function() {
      this.options.prefix = "a/b";
      this.builder.build("core");

      assert.deepEqual(this.grunt.config("copy.distribute\\.core"), {
        mode:  true,
        files: [{
            expand: false,
            cwd:  ".",
            dest: "out/packages/a/b/bin/core",
            src:  "out/dist/release/code/core/core"
        }]
      });
    });

    suite("bundle", function() {
      setup(function() {
        this.sha = Git.Commit.prototype.sha;
        Git.Commit.prototype.sha = function() {
          return "sha_hash_for_the_commit";
        };
      });

      test("adds job to archive pakcages", function() {
        var grunt = this.grunt;
        this.options.bundle = {};

        return this.builder.build("core").then(function() {
          grunt.task.assertTaskQueue([
            "clean:distribute",
            "hooks:pre-compile:release",
            "g++:release.lib.core",
            "ar:release.lib.lib",
            "g++:release.core.core",
            "link++:release.core.bin",
            "copy:distribute.core",
            "compress:distribute"
          ]);

          assert.deepEqual(grunt.config("compress.distribute"), {
            options: {
              archive: "out/packages.tar.gz",
              mode: "tgz"
            },

            files: [{
                expand: true,
                cwd:  "out/packages",
                src:  "**"
            }]
          });
        });
      });

      test("appends git hash to name", function() {
        var grunt = this.grunt;
        this.options.bundle = { version: true };

        return this.builder.build("core").then(function() {
          var conf = grunt.config("compress.distribute") || {};
          var name = (conf.options || {}).archive;
          assert.equal("out/packages-sha_hash_for_the_commit.tar.gz", name);
        });
      });

      test("short hash is used", function() {
        var grunt = this.grunt;
        this.options.bundle = { version: true, shorten_version: true };

        return this.builder.build("core").then(function() {
          var conf = grunt.config("compress.distribute") || {};
          var name = (conf.options || {}).archive;
          assert.equal("out/packages-sha_has.tar.gz", name);
        });
      });

      test("uses given archive name", function() {
        var grunt = this.grunt;
        this.options.bundle = { name: "test" };

        return this.builder.build("core").then(function() {
          var conf = grunt.config("compress.distribute") || {};
          var name = (conf.options || {}).archive;
          assert.equal("out/test.tar.gz", name);
        });
      });

      teardown(function() {
        Git.Commit.prototype.sha = this.sha;
      });
    });
  });

  // TODO(stefano): Test scripts in the scripts component.
});
