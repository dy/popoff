/*global module:false*/
module.exports = function(grunt) {

  //grunt.loadNpmTasks('homemade');
  //grunt.loadNpmTasks('vows');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['src/Color.js'/*'src/*.js'*/],
      core: 'src/Core.js'
    },    
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        trailing:false
      },
      globals: {
      },
      files:{
        options: {
          latedef:false,
          undef:false,
          forin: false
        },
        globals: {
          node:true
        }
      },
      core:{
        options: {
          evil:true,
          expr:true,
          asi:true,
          loopfunc:true
        },
        globals: {
          node:true
        }
      }
    },
    test: {
      files: ['test/*.js']
    },
    vows: {
      files: 'test/*.js', // a string or an array of files to be tested. Default: test/*.js
      reporter: 'tab' // one of Vows reporter to be used. Default: dot-matrix
    },
    nodeunit: {
      all: ['test/color-test.js']
    },
    concat: {
      dist: {
        src: [
        '<banner:meta.banner>',
        'src/Core.js',
        'src/Color.js'
        ],
        dest: '<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<config:concat.dist.dest>'],
        dest: '<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    uglify: {},
    homemade: {
      js:{
        '<%= concat.dist.dest %>' : '<config:concat.dist.dest>'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'nodeunit build');
  grunt.registerTask('build', 'concat min')
  grunt.registerTask('test', 'nodeunit')

};
