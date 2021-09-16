const gulp = require('gulp');
const pug = require('gulp-pug');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const del = require('del');
const buffer = require('vinyl-buffer')
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();

function clean() {
  return del('dist');
}

function fonts() {
  return gulp.src('dev/static/fonts/**/*.*')
    .pipe(gulp.dest('dist/static/fonts'))
}

function buildHTML() {
  return gulp.src('./dev/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: true
    }))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
}

function scss2css() {
  return gulp.src('./dev/static/styles/styles.scss')
    .pipe(plumber())
    .pipe(scss())
    .pipe(cleanCss({
      level: 2
    }))
    .pipe(autoprefixer())
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist/static/css/'))
    .pipe(browserSync.stream());
}

function script() {
  return gulp.src('./dev/static/js/main.js')
    .pipe(buffer())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/static/js/'))
    .pipe(browserSync.stream());
}

function vendors() {
  return gulp.src([
    'node_modules/svg4everybody/dist/svg4everybody.min.js'
  ])
    .pipe(concat('libs.min.js'))
    .pipe(gulp.dest('dist/static/js/vendors/'))
    .pipe(browserSync.stream());
}

function imageMinify() {
  return gulp.src([
    'dev/static/img/**/*.{jpg,png,gif,svg,webp}',
    '!dev/static/img/sprite/**/*',
  ])
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest('dist/static/img/'))
    .pipe(browserSync.stream());
}

function svgInSprite() {
  return gulp.src('dev/static/img/sprite/*.svg')
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: 'sprite.svg'
        }
      }
    }))
    .pipe(gulp.dest('dist/static/img/sprite'))
    .pipe(browserSync.stream());
}

function watch() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    }
  });

  gulp.watch('dev/pug/**/*.pug', buildHTML)
  gulp.watch([
    'dev/static/img/**/*.{jpg,png,gif,svg,webp}',
    '!dev/static/img/sprite/**/*',
  ], imageMinify)
  gulp.watch('dev/static/img/sprite/*.svg', svgInSprite)
  gulp.watch('dev/static/styles/**/*.scss', scss2css)
  gulp.watch('dev/static/js/main.js', script)
}

const workProcess = gulp.parallel(buildHTML, scss2css, script, imageMinify, svgInSprite, vendors, fonts)

exports.default = gulp.series(clean, workProcess, watch)
