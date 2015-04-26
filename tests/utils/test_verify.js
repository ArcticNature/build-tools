var assert = require("assert");
var mocha  = require("mocha");

var verify = require("../../utils/verify");


suite("Verify", function() {
  suite("Object", function() {
    setup(function() {
      this.createFailingClosure = function(value) {
        return function () { verify.notNullObject(value, "FAIL"); };
      };
    });

    test("fails if value is null", function () {
      assert.throws(this.createFailingClosure(null), /FAIL/);
    });

    test("fails if value is undefined", function () {
      assert.throws(this.createFailingClosure(), /FAIL/);
    });

    test("fails if value is not an object", function () {
      assert.throws(this.createFailingClosure(123), /FAIL/);
      assert.throws(this.createFailingClosure("abc"), /FAIL/);
    });

    test("succeeds", function() {
      verify.notNullObject({}, "Failed to detect object");
    });
  });

  suite("Optional object", function() {
    setup(function() {
      this.createFailingClosure = function(value) {
        return function () { verify.notNullObjectIfDefined(value, "FAIL"); };
      };
    });

    test("fails if value is null", function () {
      assert.throws(this.createFailingClosure(null), /FAIL/);
    });

    test("fails if value is not an object", function () {
      assert.throws(this.createFailingClosure(123), /FAIL/);
      assert.throws(this.createFailingClosure("abc"), /FAIL/);
    });

    test("succeeds if value is undefined", function () {
      verify.notNullObjectIfDefined(undefined, "Failed to detect undefined");
    });

    test("succeeds", function() {
      verify.notNullObjectIfDefined({}, "Failed to detect object");
    });
  });

  suite("String", function() {
    setup(function() {
      this.createFailingClosure = function(value) {
        return function () { verify.notEmptyString(value, "FAIL"); };
      };
    });

    test("fails if value is empty string", function () {
      assert.throws(this.createFailingClosure(""), /FAIL/);
    });

    test("fails if value is undefined", function () {
      assert.throws(this.createFailingClosure(), /FAIL/);
    });

    test("fails if value is not a string", function () {
      assert.throws(this.createFailingClosure(123), /FAIL/);
      assert.throws(this.createFailingClosure({}), /FAIL/);
    });

    test("succeeds", function() {
      verify.notEmptyString("abc", "Failed to detect string");
    });
  });
});
