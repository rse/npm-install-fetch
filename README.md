
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
automatically fetching external resources during the `install` step
of the Node Package Manager (NPM). It is primarily intended to let
large NPM modules have a small NPM module distribution size, as the NPM
registry dislikes too large (more than a few MB) distribution tarballs
(mainly because it keeps all versions of an NPM module and this way it
would get flooded with a massive amount of data).

Installation
------------

```shell
$ npm install npm-install-fetch --save-dev
```

Usage
-----

There are three distinct ways of using it:

1. Command-Line Interface (CLI) with CLI Options:<br/>

    - Example `package.json` (single resource only):

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

    - Supported CLI Options:

        - `-h`, `--help`: show usage help
        - `-V`, `--version`: show program version information
        - `-c <file>`, `--config <file>`: path to YAML configuration file (default: `"npm-install-fetch.yaml"`)
        - `-n <name>`, `--name <name>`: name of resource (default: `""`)
        - `-e`, `--extract`: extract archive to individual files
        - `-f <filter>`, `--filter <filter>`: filter extracted files(s) (default: none)
        - `-m <map-from>:<map-to>`, `--map <map-from>:<map-to>`: map extracted file paths (default: none)
        - `-s <number>`, `--strip <number>`: strip top-level directories from extracted files (default: `0`)
        - `-o <file>`, `--output <file>`: output directory or file (default: `"."`)

2. Command-Line Interface (CLI) with NPM Package Configuration Entry:<br/>

    - Example `package.json` (single resource):

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

    - Example `package.json` (multiple resources):

        ```json
        {
            "dependencies": {
                "npm-install-fetch": "latest"
            },
            "scripts": {
                "install": "npm-install-fetch"
            },
            "npm-install-fetch": [ {
                "name":    "Example1 1.2.3",
                "input":   "https://github.com/example1/example1/archive/1.2.3.tar.gz",
                "output":  "example1.tgz"
            }, {
                "name":    "Example2 1.2.3",
                "input":   "https://github.com/example2/example2/archive/1.2.3.tar.gz",
                "output":  "example2.tgz"
            } ]
        }
        ```

    - Supported Configuration Entries:

        - `name?: string`: name of resource (default: `""`)
        - `input: string`: URL of resource
        - `extract?: boolean`: extract archive to individual files (default: `false`)
        - `filter?: (string|[string+]|function)`: filter extracted files(s) (default: none)
        - `map?: ([string,string]|[[string,string]+]|function)`: map extracted file paths (default: none)
        - `strip?: number`: strip top-level directories from extracted files (default: `0`)
        - `output?: string`: output directory or file (default: `"."`)

3. Command-Line Interface (CLI) with YAML Configuration File:<br/>

    - Example `package.json`:

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

    - Example `npm-install-fetch.yaml` (single resource):

        ```yaml
        - name:    Example 1.2.3
          input:   https://github.com/example/example/archive/1.2.3.tar.gz
          output:  example.tgz
        ```

    - Example `npm-install-fetch.yaml` (multiple resources):

        ```yaml
        - name:    Example1 1.2.3
          input:   https://github.com/example1/example1/archive/1.2.3.tar.gz
          output:  example1.tgz

        - name:    Example2 1.2.3
          input:   https://github.com/example2/example2/archive/1.2.3.tar.gz
          output:  example2.tgz
        ```

    - Supported Configuration Entries:

        - `name?: string`: name of resource (default: `""`)
        - `input: string`: URL of resource
        - `extract?: boolean`: extract archive to individual files (default: `false`)
        - `filter?: (string|[string+]|function)`: filter extracted files(s) (default: none)
        - `map?: ([string,string]|[[string,string]+]|function)`: map extracted file paths (default: none)
        - `strip?: number`: strip top-level directories from extracted files (default: `0`)
        - `output?: string`: output directory or file (default: `"."`)

4. Application Programming Interface (API):<br/>

    - Example `package.json`:

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

    - Example `npm-install.js` (single resource):

        ```js
        const fetch = require("npm-install-fetch")

        fetch({
            name:    "Example 1.2.3",
            input:   "https://github.com/example/example/archive/1.2.3.tar.gz",
            output:  "example.tgz"
        })
        ```

    - Example `npm-install.js` (multiple resources):

        ```js
        const fetch = require("npm-install-fetch")

        fetch([ {
            name:    "Example1 1.2.3",
            input:   "https://github.com/example1/example1/archive/1.2.3.tar.gz",
            output:  "example1.tgz"
        }, {
            name:    "Example2 1.2.3",
            input:   "https://github.com/example2/example2/archive/1.2.3.tar.gz",
            output:  "example2.tgz"
        } ])
        ```

    - Supported Configuration Options:

        - `name?: string`: name of resource (default: `""`)
        - `input: string`: URL of resource
        - `extract?: boolean`: extract archive to individual files (default: `false`)
        - `filter?: (string|[string+]|function)`: filter extracted files(s) (default: none)
        - `map?: ([string,string]|[[string,string]+]|function)`: map extracted file paths (default: none)
        - `strip?: number`: strip top-level directories from extracted files (default: `0`)
        - `output?: string`: output directory or file (default: `"."`)

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

