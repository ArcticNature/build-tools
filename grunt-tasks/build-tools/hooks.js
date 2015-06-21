var assert = require("assert");
var path   = require("path");

var CppComponent = require("../../components/types/c++");


/**
 * Executes post clear actions.
 * This hook is called when the clear task is invoked without arguments.
 * 
 * @param {!Object} grunt The global grunt instance.
 */
var post_clear = function post_clear(grunt) {
  grunt.config.requires("get-components");
  var register = grunt.config.get("get-components")("clear");
  var daemon   = register.get("daemon");
  if (!(daemon instanceof CppComponent)) {
    throw new Error("Daemon module must be a C++ module");
  }

  grunt.config.set("clean.modules-link", path.join(
      daemon.getPath(), "src", "plugins", "initialise_extensions.cpp"
  ));
  grunt.task.run("clean:modules-link");
};


/**
 * Pre-compile hook.
 * Called before any module is built.
 * 
 * @param {!Object} grunt     The grunt instance.
 * @param {!String} hook_name The name of the hook that triggered.
 * @param {!String} target    The target mode being compiled.
 */
var pre_compile = function pre_compile(grunt, hook_name, target) {
  grunt.task.run("generate-modules-link:" + target);
};


/**
 * Maps hook names to hook implementation.
 * @type {!Object.<String, Function>}
 */
var HOOKS = {
  "post-clear":  post_clear,
  "pre-compile": pre_compile
};


/**
 * Hooks are a way to centralise logic needed by multiple tasks.
 * @param {!Object} grunt The global grunt instance.
 */
module.exports = function(grunt) {
  grunt.registerTask("hooks", function(hook) {
    assert(hook in HOOKS, "Unrecoginsed hook '" + hook + "'");
    
    // Build the arguments list to pass to the hook.
    // This includes the grunt instance plus all arguments
    // passed to the task, including the hook name itself.
    var args = [grunt];
    args.push.apply(args, arguments);

    // Now call the hook handler, setting the task as the context.
    grunt.log.verbose.writeln("Calling '" + hook + "' with '" + args + "'");
    return HOOKS[hook].apply(this, args);
  });
};
