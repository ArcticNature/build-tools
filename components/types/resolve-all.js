var Component = require("../component");


var ResolveAllComponent = module.exports = function ResolveAllComponent(
    grunt, components, target
) {
  // Build configuration.
  var config = {
    grunt: grunt,
    name:  "__resolve_all_component__",
    targets: {}
  };
  config.targets[target] = { deps: components };

  // Initialise super class.
  Component.call(this, config);
};
ResolveAllComponent.prototype = Object.create(Component.prototype);
