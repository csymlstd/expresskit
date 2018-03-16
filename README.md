# bowtie-express
Starter for an Express.js site with Webpack and BrowserSync

## Usage

To start the Express app, run `npm start`.

To start Webpack and BrowserSync, and watch your files run `npm watch`.

Production ready files can be built using `npm run build`.

## Webpack & BrowserSync
Webpack will handle SASS compiling, vendor-prefixing, CSS/JS minification and trigger BrowserSync for browser reloading.

All asset references within your SASS files will need to be referenced relative to the imported SASS files in `src/sass`, ex `(../../public/images/logo.png)`.

You may use `import '@/assets/...'` to import a file relative to the theme root in your JS files, making it easier to move them around.

## Foundation

Foundation's JS plugins are disabled by default. Uncomment the `foundation.js` import from `/assets/js/app.js` and edit the file to register the necessary plugins.
