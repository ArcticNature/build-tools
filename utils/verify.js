var verify = module.exports = {};
var HEX_COLOUR = /#[a-fA-F0-9]{6}/;


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
 * Verifies that a value is undefined or is an array.
 * @param {?Array}  value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.optionalArray = function optionalArray(value, message) {
  if (typeof value !== "undefined") {
    verify.array(value, message);
  }
};

/**
 * Verifies that a value is undefined or is an hax colour string.
 * @param {?Object} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.optionalColour = function optionalColour(value, message) {
  if (typeof value !== "undefined") {
    verify.notEmptyString(value, message);
    if (!HEX_COLOUR.test(value)) {
      throw new Error(value);
    }
  }
};

/**
 * Verifies that a value is undefined or is a not null object.
 * @param {?Object} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.optionalObject = function optionalObject(value, message) {
  if (typeof value !== "undefined") {
    verify.notNullObject(value, message);
  }
};

/**
 * Verifies that a value is undefiend or a non empty strings.
 * @param {!String} value   The value to check.
 * @param {!String} message The failure message for the thrown exception.
 */
verify.optionalNotEmptyString = function optionalNotEmptyString(
    value, message
) {
  if (typeof value !== "undefined") {
    verify.notEmptyString(value, message);
  }
};
