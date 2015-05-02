var array_utils = module.exports = {};


/**
 * Filters duplicates from an array.
 * @param {!Array} source Array of strings or numers to filter.
 * @returns {!Array} The array without duplicates.
 */
array_utils.filterDuplicates = function filterDuplicates(source) {
  var seen_items = {};
  return source.filter(function(item) {
    var seen = item in seen_items;
    seen_items[item] = true;
    return !seen;
  });
};
