/**
 * ESM entry point for gulp-has.
 *
 * The plugin is implemented in CommonJS; this wrapper exposes the same
 * function as the default export so it can be imported from ES modules:
 *
 *     import has from 'gulp-has';
 *
 * @see {@link https://github.com/jeffrose/gulp-has}
 * @license MIT
 */

import has from './index.js';

export default has;
