var assert = require("assert");
var mocha  = require("mocha");
var graph  = require("../../graph");


var TEST_GRAPH_ONE = {
  edges: [{
    from: "a",
    to:   "b",
    colour: "#b"
  }],
  nodes: {
    a: { colour: "#a", label: "a" },
    b: { colour: "#b", label: "b" },
    c: { colour: "#c", label: "c" }
  }
};

var TEST_GRAPH_TWO = {
  edges: [{
    from: "a",
    to:   "c",
    colour: "#c"
  }],
  nodes: {
    a: { colour: "#a", label: "A" },
    c: { colour: "#c", label: "c" }
  }
};


suite("Graph", function() {
  suite("merge", function() {
    test("one results in id", function() {
      var merged = graph.merge([TEST_GRAPH_ONE]);
      assert.deepEqual(TEST_GRAPH_ONE, merged);
    });

    test("merge with override", function() {
      var merged = graph.merge([TEST_GRAPH_ONE, TEST_GRAPH_TWO]);
      assert.deepEqual(merged, {
        edges: [{
          from: "a",
          to:   "b",
          colour: "#b"
        }, {
          from: "a",
          to:   "c",
          colour: "#c"
        }],
        nodes: {
          a: { colour: "#a", label: "A" },
          b: { colour: "#b", label: "b" },
          c: { colour: "#c", label: "c" }
        }
      });
    });
  });
});
