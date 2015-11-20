# Getting the code

The preferred way to install Bosonic is through [NPM](https://www.npmjs.com/package/bosonic), but you can download the Bosonic platform as a [ZIP file](https://github.com/bosonic/bosonic/releases/latest). It contains two files: `webcomponents.js`, which is the file that contains the community polyfills and `bosonic-runtime.js`, which is the Bosonic library (not the elements!).

## With npm

We'll assume you've already installed Node.js and NPM ([platform specific installation instructions](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)).

If you've just setup your project and haven't created a `package.json` file, it's now time to generate one:

``` bash
npm init
```

You can now install the Bosonic package:

``` bash
npm install --save bosonic
```

Don't forget to install the `webcomponents.js` polyfills ; they're bundled with the Bosonic package as a dependency, but as you may know, npm installs dependencies in a nested hierarchy, which is not always practical.

``` bash
npm install --save webcomponents.js
```

## Installing elements

Bosonic's elements are grouped in several NPM packages, but as [dnd-elements](https://github.com/bosonic/dnd-elements) and [data-elements](https://github.com/bosonic/data-elements) are still a Work-In-Progress, they aren't published yet.

``` bash
npm install --save bosonic-core-elements
```

[Bosonic Core Elements](https://github.com/bosonic/core-elements) are available as a [ZIP file](https://github.com/bosonic/core-elements/releases/latest) too.

## Project setup

Some elements depends on other elements ; all elements should therefore reside in the same folder when developing. If you downloaded ZIP files, extract all the files into the same folder. If you used NPM, you'll need to copy files from the installed packages into a "developement" folder. Depending on your task runner of choice, you can use [grunt-contrib-copy]() or [gulp-copy]() to do this.

### Use a web server

Because of the way HTML imports work, you'll need a local web server to use Bosonic elements (usage of the `file:` protocol is blocked by Cross-Origin Resource Sharing policy).
