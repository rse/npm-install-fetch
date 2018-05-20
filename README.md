
npm-install-fetch
=================

Fetch External Resources on NPM Package Installation

<p/>
<img src="https://nodei.co/npm/npm-install-fetch.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/npm-install-fetch.png" alt=""/>

About
-----

This [Node.js](https://nodejs.org) module provides an API and CLI for
fetching external resources during the `install` step of the Node
Package Manager (NPM). It is intended to let large NPM modules have a
small NPM module distribution size, as the NPM registry dislikes too
large (more than a few MB) distribution tarballs (mainly because it
keeps all versions of an NPM module and this way it would get flooded
with a massive amount of data).

Installation
------------

```shell
$ npm install npm-install-fetch --save-dev
```

Usage
-----

There are three distinct ways of using it:

1. Command-Line Interface (CLI) with CLI Options:<br/>

    - `package.json`:

        ```json
        {
            "dependencies": {
                "npm-install-fetch": "latest"
            },
            "scripts": {
                "install": "npm-install-fetch -n \"Example 1.2.3\" -o example.tgz https://github.com/example/example/archive/1.2.3.tar.gz"
            }
        }
        ```

2. Command-Line Interface (CLI) with NPM Package Configuration Entry:<br/>

    - `package.json`:

        ```json
        {
            "dependencies": {
                "npm-install-fetch": "latest"
            },
            "scripts": {
                "install": "npm-install-fetch"
            },
            "npm-install-fetch": {
                "name":    "Example 1.2.3",
                "input":   "https://github.com/example/example/archive/1.2.3.tar.gz",
                "output":  "example.tgz"
            }
        }
        ```

3. Command-Line Interface (CLI) with YAML Configuration File:<br/>

    - `package.json`:

        ```json
        {
            "dependencies": {
                "npm-install-fetch": "latest"
            },
            "scripts": {
                "install": "npm-install-fetch"
            }
        }
        ```

    - `npm-install-fetch.yaml`:

        ```yaml
        - name:    Example 1.2.3
          input:   https://github.com/example/example/archive/1.2.3.tar.gz
          output:  example.tgz
        ```

4. Application Programming Interface (API):<br/>

    - `package.json`:

        ```json
        {
            "dependencies": {
                "npm-install-fetch": "latest"
            },
            "scripts": {
                "install": "node npm-install.js"
            }
        }
        ```

    - `npm-install.js`:

        ```js
        const fetch = require("npm-install-fetch")

        fetch([{
            name:    "Example 1.2.3",
            input:   "https://github.com/example/example/archive/1.2.3.tar.gz",
            output:  "example.tgz"
        }])
        ```

License
-------

Copyright (c) 2018 Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

