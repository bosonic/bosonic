# bosonic

[![Join the chat at https://gitter.im/bosonic/bosonic](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/bosonic/bosonic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Description

```
├── dist
├── lib
│   ├── HTMLImports
│   ├── MutationObservers
│   ├── WeakMap
│   └── document-register-element
├── src
│   ├── platform
│   ├── runtime
│   └── transpiler
│       └── visitors
└── test
    ├── platform
    └── transpiler
```

- `dist`: where the lib is built, contains two files `bosonic-platform.js` and `bosonic-runtime.js`
- `lib`: contains git submodules. See develop chapter for more information
- `src`: contains source code for bosonic
- `test`: contains platform and transpiler tests. See gulp tasks for more information

## Develop

### bootstrap

Fetch the repository and all its dependencies.

```
mkdir bosonic
cd bosonic
git clone git@github.com:bosonic/bosonic.git
git@github.com:bosonic/tools.git
cd tools
npm link
cd ../bosonic
npm install
npm link bosonic-tools
git submodule update --init
```

### build

The bosonic repository comes with a stable build located in `dist` folder.

To build the packages, run:

```
grunt concat
```

### run tests

Run transpiler tests:

```
grunt test:transpiler
```

Run platform tests:

We use Sauce Labs to make multi platforms tests. To be able to use sauce labs, you need to create `sauce.json` at the root of the bosonic project.

```
{
    "username": "yourSauceUsername",
    "accessKey": "yourSauceAccessKey"
}
```

Then run:

```
grunt test:platform
```

Tested platforms:

- Internet Explorer 9, 10, 11
- Safari 8
- Android 4.4
- iOS 8.1
- Chrome 35
- Firefox 30
