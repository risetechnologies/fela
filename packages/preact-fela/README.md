# Preact Fela

Official [Preact](https://github.com/Preactjs/Preact) bindings for Fela.

<img alt="npm downloads" src="https://img.shields.io/npm/dm/preact-fela.svg">
<img alt="gzipped size" src="https://img.shields.io/badge/gzipped-2.31kb-brightgreen.svg">

This package only includes Preact bindings for [Fela](http://github.com/rofrischmann/fela).<br>
It assumes you already know about Fela and how to use it.

## Installation
```sh
npm i --save preact-fela
```
Assuming you are using [npm](https://www.npmjs.com) as your package manager you can just `npm install`.<br>
Otherwise we also provide a [UMD](https://github.com/umdjs/umd). You can easily use it via [unpkg](https://unpkg.com/). It registers a  `PreactFela` global.
> **Caution**: You need to include both Preact and Fela on your own as well.

```HTML
<!-- Development build (with warnings)  -->
<script src="https://unpkg.com/preact-fela@4.3.5/dist/preact-fela.js"></script>
<!-- Production build (minified)  -->
<script src="https://unpkg.com/preact-fela@4.3.5/dist/preact-fela.min.js"></script>
```


## API
This package does not ship separate API documentation as it implements the exact same API as the [react-fela](https://github.com/rofrischmann/fela/packages/react-fela) bindings. Check those out instead.

## Usage
For more information and best practices on how to effectively use this package, please check out the main [Fela Documention - Usage with Preact](http://fela.js.org/docs/guides/UsageWithPreact.html). There you will also find some usage examples. This package only contains the pure API reference documentation.

## License
Fela is licensed under the [MIT License](http://opensource.org/licenses/MIT).<br>
Documentation is licensed under [Creative Common License](http://creativecommons.org/licenses/by/4.0/).<br>
Created with ♥ by [@rofrischmann](http://rofrischmann.de) and all the great contributors.
