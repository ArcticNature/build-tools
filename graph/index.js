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


var GraphIndirect = function(graph) {
  this._graph = graph;
  this._adjacents = {};
  this._edges = [];
};

GraphIndirect.prototype.addEdge = function addEdge(from, to) {
  this._edges.push({
    from: from,
    to: to,
    colour: this._graph.nodes[to].colour
  });
};

// Convert edges to map from -> [to]
GraphIndirect.prototype.buildAdjacents = function buildAdjacents() {
  var adjacents = this._adjacents;
  this._graph.edges.forEach(function(edge) {
    if (!adjacents.hasOwnProperty(edge.from)) {
      adjacents[edge.from] = [];
    }
    adjacents[edge.from].push(edge.to);
  });
};

// Remove duplicate edges and return the list of discovered edges.
GraphIndirect.prototype.edges = function edges() {
  var start_nodes = {};
  return this._edges.filter(function(edge) {
    // Check edge duplication.
    var targets   = start_nodes[edge.from] || {};
    var duplicate = targets[edge.to];

    // Mark the edge.
    start_nodes[edge.from] = targets;
    targets[edge.to] = true;

    // Return the filter condition.
    return !duplicate;
  });
};

GraphIndirect.prototype.indirect = function indirect() {
  var _this = this;
  var nodes = Object.keys(this._graph.nodes);
  this.buildAdjacents();

  nodes.forEach(function(node) {
    _this.visitNode(null, node, {});
  });
};

GraphIndirect.prototype.visitNode = function visitNode(parent, node, reached) {
  var _this = this;
  var adjacents = this._adjacents[node] || [];

  // First go to all adjacent nodes.
  adjacents.forEach(function(adjacent) {
    _this.visitNode(node, adjacent, reached);
  });

  // Add the edge from my parent to myself if no other path did it.
  // Do it only if the parent node exists.
  if (!parent || reached[node]) {
    return;
  }
  reached[node] = true;
  this.addEdge(parent, node);
};


/**
 * Removes direct edges that can be derived from paths.
 *
 * Example:
 *  Before: A -> B -> C
 *          |         ^
 *          \---------/
 *
 *  After:  A -> B -> C
 *
 * @param {!Object} graph The graph to process.
 * @returns {!Object} The graph with redundant direct edges removed.
 */
index.indirect = function indirect(graph) {
  var indirector = new GraphIndirect(graph);
  indirector.indirect();
  return {
    edges: indirector.edges(),
    nodes: graph.nodes
  };
};
