/*
**  NPM-Install-Fetch -- Fetch External Resources on NPM Package Installation
**  Copyright (c) 2018 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  internal requirements  */
const path          = require("path")
const fs            = require("mz/fs")

/*  external requirements  */
const ducky         = require("ducky")
const sprintf       = require("sprintfjs")
const requester     = require("request")
const decompress    = require("decompress")
const minimatch     = require("minimatch")
const getProxy      = require("get-proxy")
const npmExecute    = require("npm-execute")
const chalk         = require("chalk")
const stripAnsi     = require("strip-ansi")

/*  load my own information  */
const my = require("./package.json")

/*  some glyph icons  */
const glyphicon = {
    crown: { unicode: "♕", ascii: "+" },
    star:  { unicode: "★", ascii: "*" },
    gear:  { unicode: "⚙", ascii: "@" },
    arrow: { unicode: "▶", ascii: ">" }
}

/*  define the API function  */
const fetch = async (requests) => {
    /*  sanity check options  */
    let errors = []
    if (!ducky.validate(requests, `[ {
        name?:    string,
        input:    string,
        extract?: boolean,
        filter?:  (string|[string+]|function),
        map?:     ([string,string]|[[string,string]+]|function),
        strip?:   number,
        output?:  string
    }+ ]`, errors))
        throw new Error(`invalid requests parameter: ${errors.join(", ")}`)

    /*  determine standard HTTP fetching parameters  */
    let httpOpts = {
        method:   "GET",
        encoding: null,
        headers: {
            "User-Agent": `${my.name}/${my.version}`
        }
    }

    /*  determine proxy-related HTTP fetching parameters  */
    let proxy = getProxy()
    if (proxy === null) {
        let result = await npmExecute([ "config", "get", "proxy" ]).catch(() => null)
        if (result !== null) {
            let stdout = result.stdout.toString().replace(/\r?\n$/, "")
            if (stdout.match(/^https?:\/\/.+/))
                proxy = stdout
        }
    }
    if (proxy !== null)
        httpOpts.proxy = proxy

    /*  display output  */
    const display = (msg) => {
        if (!process.stdout.isTTY) {
            msg = stripAnsi(msg)
            Object.keys(glyphicon).forEach((name) => {
                msg = msg.replace(new RegExp(glyphicon[name].unicode, "g"), glyphicon[name].ascii)
            })
        }
        process.stdout.write(msg)
    }

    /*  iterate over all requests...  */
    for (let i = 0; i < requests.length; i++) {
        let request = requests[i]

        /*  fill options with defaults  */
        request = Object.assign({}, {
            name:    "",
            extract: false,
            strip:   0,
            output:  "."
        }, request)

        /*  sanity check usage  */
        if (request.filter && !request.extract)
            throw new Error("option \"filter\" requires option \"extract\"")
        if (request.map && !request.extract)
            throw new Error("option \"map\" requires option \"extract\"")
        if (request.strip && !request.extract)
            throw new Error("option \"strip\" requires option \"extract\"")

        /*  download the resource  */
        let httpOptsLocal = Object.assign({}, httpOpts, {
            url: request.input
        })
        if (request.name)
            display(`${glyphicon.crown.unicode} ${chalk.reset("resource:")} ` +
                `${chalk.blue.bold(request.name)}\n`)
        display(`${chalk.grey(glyphicon.star.unicode)} ${chalk.reset("location:")} ` +
            `${chalk.blue(request.input)}\n`)
        const filesize = (size) => {
            return sprintf("%d", size)
                .replace(/(\d+)(\d{3})(\d{3})$/, "$1.$2.$3")
                .replace(/(\d+)(\d{3})$/, "$1.$2")
        }
        let data = await new Promise((resolve, reject) => {
            const req = requester(httpOptsLocal, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    if (process.stdout.isTTY)
                        display(`\r${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                            `${chalk.blue(filesize(body.length))} bytes received.            \n`)
                    else
                        display(`${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                            `${chalk.blue(filesize(body.length))} bytes received.\n`)
                    resolve(body)
                }
                else
                    reject(new Error(`download failed: ${error}`))
            })
            let len = 0
            let lenMax = -1
            req.on("response", (response) => {
                if (response.statusCode === 200 && response.headers["content-length"] !== "") {
                    lenMax = parseInt(response.headers["content-length"])
                    if (!(lenMax >= 0))
                        reject(new Error(`download failed: invalid Content-Length`))
                }
            })
            req.on("data", (data) => {
                len += data.length
                if (process.stdout.isTTY) {
                    if (lenMax !== -1)
                        display(`\r${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                            `${chalk.blue(filesize(len))} bytes (${chalk.blue(((len / lenMax) * 100).toFixed(0) + "%")}) received... `)
                    else
                        display(`\r${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                            `${chalk.blue(filesize(len))} bytes received... `)
                }
            })
        })

        /*  generate output  */
        let stat = await fs.stat(request.output).catch(() => null)
        if (!request.extract) {
            /*  save single file  */
            if (stat !== null && stat.isDirectory()) {
                let url = new URL(request.input)
                request.output = path.join(request.output, path.basename(url.pathname))
            }
            else if (stat !== null && !stat.isFile())
                throw new Error(`output path ${request.output} exists, but is neither directory nor file`)
            await fs.writeFile(request.output, data, { encoding: null })
            display(`${glyphicon.arrow.unicode} ${chalk.reset("outcomes:")} ` +
                `${chalk.blue(request.output)} (1 file)\n`)
        }
        else {
            /*  extract multiple files from archive  */
            if (stat !== null && !stat.isDirectory())
                throw new Error(`output path ${request.output} exists, but is not a directory`)
            else if (stat === null)
                await fs.mkdir(request.output, 0o755)
            let filter = request.filter
            if (filter === undefined)
                filter = (path) => true
            if (typeof filter === "string")
                filter = [ filter ]
            if (typeof filter !== "function") {
                let patterns = filter
                filter = (path) => {
                    let take = (patterns[0][0] === "!")
                    patterns.forEach((pattern) => {
                        let negate = (pattern[0] === "!")
                        if (negate)
                            pattern = pattern.substr(1)
                        if (minimatch(path, pattern))
                            take = !negate
                    })
                    return take
                }
            }
            let map = request.map
            if (map === undefined)
                map = (path) => path
            if (typeof map === "object" && typeof map[0] === "string")
                map = [ map ]
            if (typeof map !== "function") {
                let mappings = map
                map = (path) => {
                    mappings.forEach((mapping) => {
                        path = path.replace(mapping[0], mapping[1])
                    })
                    return path
                }
            }
            let files = await decompress(data, request.output, {
                filter: (file) => { return filter(file.path) },
                map:    (file) => { file.path = map(file.path); return file },
                strip:  request.strip
            })
            display(`${glyphicon.arrow.unicode} ${chalk.reset("outcomes:")} ` +
                `${chalk.blue(request.output)} (${files.length} files)\n`)
        }
        display("\n")
    }
}

/*  export the API function  */
module.exports = fetch

