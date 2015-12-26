module.exports = function(grunt) {
  var Components = require("./build-tools/components");
  var GrHunter   = require("./build-tools/grhunter");
  var grhunter   = new GrHunter(grunt);

  // Regiter modules to load.
  grhunter.package(grunt.file.readJSON("package.json"));
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-shell");

  grunt.loadTasks("build-tools/grunt-tasks/build-tools");
  grunt.loadTasks("build-tools/grunt-tasks/c++/compilation");
  grunt.loadTasks("build-tools/grunt-tasks/c++/tools");
  grunt.loadTasks("build-tools/grunt-tasks/generic");
  grunt.loadTasks("build-tools/grunt-tasks/protobuf");
  grunt.loadTasks("build-tools/grunt-tasks/targets");

  // Load speacial modules.
  grhunter.loadModule("./build-tools/grunt-modules/build-tools");
  grhunter.compose();

  // Lasy load components only if and when requested.
  grunt.config.set("get-components", function(target) {
    return Components.getComponents(grunt, target);
  });

  grunt.registerTask("default", "release");
};


//  grunt.initConfig({
//    clean: {
//      "dist.json":   "snow-fox-json/dist",
//      "docs":        "docs/output"
//    },
//
//    copy: {
//      docs: {
//        files: [{
//          expand: true,
//          cwd:    "docs/theme/js",
//          src:    ["**"],
//          dest:   "docs/output/custom-html/js"
//        }, {
//          expand: true,
//          cwd:    "docs/images",
//          src:    ["**"],
//          dest:   "docs/output/custom-html/images"
//        }]
//      }
//    },
//
////    "handlebars-expand": {
////      options: {
////        helpers_dir:   "docs/theme/helpers",
////        partials_dir:  "docs/theme/templates",
////        plugins_dir:   "docs/theme/plugins",
////        templates_dir: "docs/theme/templates"
////      }
////    },
//
//    less: {
//      docs: {
//        files: {
//          "docs/output/custom-html/style.css": "docs/theme/less/all.less"
//        }
//      }
//    },
//
//    shell: {
//      doxygen: { command: "doxygen docs/doxyfile", }
//    }
//  });
//
//
//  // Load external tasks.
//  grunt.loadNpmTasks("grunt-contrib-copy");
//  grunt.loadNpmTasks("grunt-contrib-less");
