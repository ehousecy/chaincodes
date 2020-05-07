const { src, parallel, dest, series } = require('gulp');
const babel = require('gulp-babel');
const pkg = require('./package.json');

function copyIndexes() {
  return src(['./src/META-INF/**']).pipe(dest('./build/META-INF'));
}

function copyPackageJson() {
  return src(['./src/package.json']).pipe(dest('./build/'));
}

function copyToChaincodes() {
  return src([
    './build/**',
    '!**/node_modules/**'
  ]).pipe(dest(`./chaincodes/javascript/${pkg.name}_${pkg.version}`));
}

function compile() {
  return src(['./src/**/*.js', '!**/__tests__/**', '!**/node_modules/**'])
    .pipe(
      babel({
        plugins: [
          '@babel/transform-modules-commonjs',
          '@babel/proposal-class-properties',
        ]
      })
    )
    .pipe(dest('./build'));
}

exports.default = exports.compile = series(
  parallel(copyIndexes, copyPackageJson, compile),
  copyToChaincodes
);
