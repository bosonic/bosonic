# Putting into production

If you use several of elements in your app, you'll get a lot of network requests (one for each HTML import), and that's not necessarily good for performance (until we all start using [Http2](https://en.wikipedia.org/wiki/HTTP/2)). It's therefore often necessary in today's web applications to concatenate Web Components into a single file.

## Concatenating Web Components

The Polymer authors have developed a handy tool for that purpose that's called [Vulcanize](https://github.com/Polymer/vulcanize). It's a command line tool that easily integrates with your build tool of choice, that recursively pulls in all your imports, flattens their dependencies and spits out a single file.

## In the future

We have a specific build tool in the works that will leverage Vulcanize and include CSS Variables post-processing. It will be released in a few weeks, stay tuned!