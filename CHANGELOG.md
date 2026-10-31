# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- License changed from Apache-2.0 to MIT. This applies from the next release
  onward; published versions up to 1.1.0 remain Apache-2.0.

## [1.1.0] - 2026-10-31

### Added

- ESM entry point (`index.mjs` plus an `exports` map): `import has from
  'gulp-has'` now works explicitly alongside `require( 'gulp-has' )`.
- `options.names` to replace custom detector function names, e.g.
  `has( config, { names: [ 'supports' ] } )`.
- `options.replaceUnknown` to replace tests missing from `config` with `false`
  instead of leaving them untouched (defaults to `false`).
- Detector calls with backtick quotes are now replaced.
- Continuous integration via GitHub Actions (Node.js 22 and 24).
- Expanded test suite running on mocha 12 with c8 coverage, plus
  `package-lock.json`.

### Changed

- **Node.js 22 or newer is now required** (previously `>= 0.10`). This is the
  only potentially breaking change; the old floor had been inaccurate for
  years.
- Replaced the deprecated `gulp-util` dependency with `plugin-error`.
- Replaced the unmaintained gulp 3 / gulp-istanbul / gulp-mocha / chai test
  harness with direct mocha and c8 npm scripts (`gulpfile.js` removed).
- Modernized `package.json` metadata (`exports`, `type`, `repository` object,
  scripts) and project configs.

### Fixed

- `has(...)` calls that are part of a longer identifier or of a property
  access (`myhas( 'x' )`, `map.has( 'x' )`) are no longer replaced.
- Calls with mismatched quotes (`has( 'x" )`) are no longer replaced.
- Fixed a crash ("write after end") when more than one stream-based file was
  processed in a single run.
- Fixed a crash when `config` was created with `Object.create( null )` or
  defines its own `hasOwnProperty` key.
- Deprecated `new Buffer()` replaced with `Buffer.from()`.
- Errors from file content streams are now forwarded to the plugin stream, so
  a failed stream is surfaced instead of being dropped by the pipe.
- Detector calls split across stream chunk boundaries are now replaced.

## [1.0.0] - 2015-07-11

Initial release.
