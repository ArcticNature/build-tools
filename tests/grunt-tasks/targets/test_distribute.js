var assert = require("assert");
var mocha  = require("../grunt-suite");

var DistributionBuilder = require("../../../distribute");

var MockPromise = function MockPromise() {};
MockPromise.prototype.then = function() { return this; };
MockPromise.prototype["catch"] = function() { return this; };


gruntSuite("Distribute grunt task", "targets/distribute", function() {
  test("fails if distribution.json not found", function() {
    this.grunt.testTask("distribute");
    assert.deepEqual(
        this.grunt.log.error_logs,
        ["Need a distribution.json file to build packages."]
    );
  });

  test("fails if no package is found", function() {
    this.grunt.file.set_files({
      "distribution.json": JSON.stringify({ options: {} })
    });

    this.grunt.testTask("distribute");
    assert.deepEqual(
        this.grunt.log.error_logs,
        ["No packages to build were found."]
    );
  });

  test("fails if requested package is not found", function() {
    this.grunt.file.set_files({
      "distribution.json": JSON.stringify({ release: {} })
    });

    this.grunt.testTask("distribute", "test");
    assert.deepEqual(
        this.grunt.log.error_logs,
        ["Package 'test' was not found."]
    );
  });

  suite("builds", function() {
    setup(function() {
      var _this = this;
      this.built_all = false;
      this.built_one = false;
      this.setComponents(null);

      // Patch DistributionBuilder.
      this.all = DistributionBuilder.prototype.all;
      this.one = DistributionBuilder.prototype.build;
      DistributionBuilder.prototype.all = function() {
        _this.built_all = true;
        return new MockPromise();
      };
      DistributionBuilder.prototype.build = function() {
        _this.built_one = true;
        return new MockPromise();
      };
    });

    test("all", function() {
      this.grunt.file.set_files({
        "distribution.json": JSON.stringify({ test: {} })
      });

      this.grunt.testTask("distribute");
      assert(this.built_all,  "Did not build all");
      assert(!this.built_one, "Should not build one");
    });

    test("one", function() {
      this.grunt.file.set_files({
        "distribution.json": JSON.stringify({ test: {} })
      });

      this.grunt.testTask("distribute", "test");
      assert(!this.built_all, "Should not build all");
      assert(this.built_one,  "Did not build one");
    });

    teardown(function() {
      // Undo patch.
      DistributionBuilder.prototype.all = this.all;
      DistributionBuilder.prototype.build = this.one;
    });
  });
});
