var verify = module.exports = {};


/**
 * Verifies that a value is an Array.
 * @param {!Array}  value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.array = function array(value, message) {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
};

/**
 * Verifies that a value is a non empty strings.
 * @param {!String} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.notEmptyString = function notEmptyString(value, message) {
  if (typeof value !== "string" || value === "") {
    throw new Error(message);
  }
};

/**
 * Verifies that a value is a non null object.
 * @param {!Object} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.notNullObject = function notNullObject(value, message) {
  if (typeof value !== "object" || value === null) {
    throw new Error(message);
  }
};

/**
 * Verifies that a value is undefined or a non null object.
 * @param {?Object} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.notNullObjectIfDefined = function notNullObject(value, message) {
  if (typeof value !== "undefined") {
    verify.notNullObject(value, message);
  }
};

/**
 * Verifies that a value is undefined or is an array
 * @param {?Array}  value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.optionalArray = function optionalArray(value, message) {
  if (typeof value !== "undefined") {
    verify.array(value, message);
  }
};
