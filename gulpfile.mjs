import gulp from 'gulp';
const { src, dest, series, watch } = gulp;

// HTML
import fileInclude from 'gulp-file-include';
import htmlmin from 'gulp-htmlmin';
import typograf from 'gulp-typograf';

// CSS + SASS
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import cleanCSS from 'gulp-clean-css';
import gulpSassGlob from 'gulp-sass-glob';

// IMAGE + SVG
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';
import svgSprite from 'gulp-svg-sprite';
import webp from 'gulp-webp';
import cheerio from 'gulp-cheerio';
import replace from 'gulp-replace';
import svgmin from 'gulp-svgmin';

// ERROR HANDLING
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';

// MODULES
import webpackStream from 'webpack-stream';
import CompressionPlugin from 'compression-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import autoprefixer from 'gulp-autoprefixer';
import { create as browserSyncCreate } from 'browser-sync';
const browserSync = browserSyncCreate();
import gulpif from 'gulp-if';
import rev from 'gulp-rev';
import revdel from 'gulp-rev-delete-original';
import { deleteAsync } from 'del';
import ghPages from 'gulp-gh-pages';

// ПУТИ
const srcFolder = './src';
const buildFolder = './app';

// внутренние пути папки src
const srcPaths = {
  srcAssetsFolder: `${srcFolder}/resources`,
  srcHtmlFolder: `${srcFolder}/partials`,
  srcImagesFolder: `${srcFolder}/images`,
  srcSvgSpritesFolder: `${srcFolder}/images/svg/**.svg`,
  srcMainJsFileFolder: `${srcFolder}/js/main.js`,
  srcFullJsFolder: `${srcFolder}/js/**/*.js`,
  srcScssFolder: `${srcFolder}/scss/**/*.scss`,
};

// внутренние пути папки app
const appPaths = {
  buildAssetsFolder: `${buildFolder}/assets`,
  buildImagesFolder: `${buildFolder}/images/`,
  buildJsFolder: `${buildFolder}/js`,
  buildCssFolder: `${buildFolder}/css`,
};

let isProd = false;

// удаление папки с билдом
const clean = () => {
  return deleteAsync([buildFolder]);
};

// функция обработки ошибок
function plumberNotify(title) {
  return {
    errorHandler: notify.onError({
      title: title,
      message: 'Error <%= error.message %>',
      sound: false,
    }),
  };
}

// функция обработки html-компонентов
function includeFiles() {
  return src([`${srcFolder}/*.html`])
    .pipe(
      fileInclude({
        prefix: '@',
        basepath: '@file',
      }),
    )
    .pipe(typograf({ locale: ['ru', 'en-US'] }))
    .pipe(dest(buildFolder))
    .pipe(browserSync.stream());
}

// минификация html
const htmlMinify = () => {
  return src(`${buildFolder}/**/*.html`)
    .pipe(
      htmlmin({
        collapseWhitespace: true,
      }),
    )
    .pipe(dest(buildFolder));
};

// функция обработки стилей
function styles() {
  return src(srcPaths.srcScssFolder, { sourcemaps: !isProd })
    .pipe(plumber(plumberNotify('SCSS')))
    .pipe(gulpSassGlob())
    .pipe(sass())
    .pipe(
      autoprefixer({
        cascade: false,
        grid: true,
        overrideBrowserslist: ['last 5 versions'],
      }),
    )
    .pipe(
      gulpif(
        isProd,
        cleanCSS({
          level: 2,
        }),
      ),
    )
    .pipe(dest(appPaths.buildCssFolder, { sourcemaps: '.' }))
    .pipe(browserSync.stream());
}

// функция обработки скриптов
function scripts() {
  return src(srcPaths.srcMainJsFileFolder)
    .pipe(
      plumber(
        notify.onError({
          title: 'JS',
          message: 'Error: <%= error.message %>',
        }),
      ),
    )
    .pipe(
      webpackStream({
        mode: isProd ? 'production' : 'development',
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        targets: 'defaults',
                      },
                    ],
                  ],
                },
              },
            },
            {
              test: /\.css$/i,
              use: ['style-loader', 'css-loader'],
            },
          ],
        },
        optimization: {
          minimize: true,
          minimizer: [new TerserPlugin()],
          usedExports: true,
        },
        plugins: [
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 1024,
            minRatio: 0.8,
          }),
          new TerserPlugin(),
        ],
        devtool: !isProd ? 'source-map' : false,
      }),
    )
    .on('error', function (err) {
      console.error('WEBPACK ERROR', err);
      this.emit('end');
    })
    .pipe(dest(appPaths.buildJsFolder))
    .pipe(browserSync.stream());
}

// ассеты
function assets() {
  return src(`${srcPaths.srcAssetsFolder}/**`).pipe(dest(buildFolder));
}

// функция обработки изображений
function images() {
  return src([`${srcPaths.srcImagesFolder}/**/**.{jpg,jpeg,png,svg}`])
    .pipe(
      gulpif(
        isProd,
        imagemin([
          mozjpeg({
            quality: 85,
            progressive: true,
          }),
          optipng({
            optimizationLevel: 2,
          }),
        ]),
      ),
    )
    .pipe(dest(appPaths.buildImagesFolder));
}

// конвертация изображений в webp
function webpImages() {
  return src([`${srcPaths.srcImagesFolder}/**/**.{jpg,jpeg,png}`])
    .pipe(webp())
    .pipe(dest(appPaths.buildImagesFolder));
}

// обработка svg-спрайтов
function sprite() {
  return src(srcPaths.srcSvgSpritesFolder)
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      }),
    )
    .pipe(
      cheerio({
        run: function ($) {
          $('[fill]').removeAttr('fill');
          $('[stroke]').removeAttr('stroke');
          $('[style]').removeAttr('style');
        },
        parserOptions: {
          xmlMode: true,
        },
      }),
    )
    .pipe(replace('&gt;', '>'))
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
          },
        },
      }),
    )
    .pipe(dest(appPaths.buildImagesFolder));
}

gulp.task('deploy', function () {
  return gulp.src('./app/**/*').pipe(ghPages());
});

// кэш
const cacheFiles = () => {
  return src(`${buildFolder}/**/*.{css,js,woff2,svg,png,jpg,jpeg,webp}`, {
    base: buildFolder,
  })
    .pipe(rev())
    .pipe(revdel())
    .pipe(dest(buildFolder))
    .pipe(rev.manifest('rev.json'))
    .pipe(dest(buildFolder));
};

// watcher
function watching() {
  browserSync.init({
    server: {
      baseDir: `${buildFolder}`,
    },
  });

  watch(srcPaths.srcScssFolder, styles);
  watch(srcPaths.srcFullJsFolder, scripts);
  watch(`${srcPaths.srcHtmlFolder}/*.html`, includeFiles);
  watch(`${srcFolder}/*.html`, includeFiles);
  watch(`${srcPaths.srcAssetsFolder}/**`, assets);
  watch(srcPaths.srcSvgSpritesFolder, sprite);
  watch(`${srcPaths.srcImagesFolder}/**/**.{jpg,jpeg,png,svg}`, images);
  watch(`${srcPaths.srcImagesFolder}/**/**.{jpg,jpeg,png}`, webpImages);
}

function toProd(done) {
  isProd = true;
  done();
}

export const files = includeFiles;

// default
export default series(
  clean,
  includeFiles,
  scripts,
  styles,
  assets,
  images,
  webpImages,
  sprite,
  watching,
);

// build
export const build = series(
  toProd,
  clean,
  includeFiles,
  scripts,
  styles,
  assets,
  images,
  webpImages,
  sprite,
  htmlMinify,
);

// cache
export const cache = cacheFiles;
