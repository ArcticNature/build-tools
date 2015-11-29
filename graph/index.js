var index = module.exports = {};
index.dot = require("./dot");

/**
 * Merges two or more graphs into one.
 * The graphs to merge are specified as arguments with the
 * right-most graphs overriding the left-most ones.
 *
 * @param {!Array.<Object>} graphs A list of graphs to merge.
 * @return {!Object} A new graph which merges the arguments.
 */
index.merge = function merge(graphs) {
  var merged = {
    edges: [],
    nodes: {}
  };

  graphs.forEach(function(graph) {
    Object.keys(graph.nodes).forEach(function(node_id) {
      merged.nodes[node_id] = graph.nodes[node_id];
    });
    merged.edges.push.apply(merged.edges, graph.edges);
  });

  return merged;
};
