const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'feedback-widget.js',
  format: 'iife',
  target: ['es2015'],
  minify: false, // Keep it readable to match original style if we want, or true to minify
}).catch(() => process.exit(1));
