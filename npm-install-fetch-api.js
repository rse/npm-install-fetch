/*
**  NPM-Install-Fetch -- Fetch External Resources on NPM Package Installation
**  Copyright (c) 2018-2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
const got           = require("got")
const decompress    = require("decompress")
const micromatch    = require("micromatch")
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
    const errors = []
    if (!ducky.validate(requests, `[ {
        arch?:     string,
        platform?: string,
        name?:     string,
        input:     string,
        extract?:  boolean,
        filter?:   (string|[string+]|function),
        map?:      ([string,string]|[[string,string]+]|function),
        strip?:    number,
        output?:   string
    }+ ]`, errors))
        throw new Error(`invalid requests parameter: ${errors.join(", ")}`)

    /*  determine standard HTTP fetching parameters  */
    const httpOpts = {
        method:   "GET",
        headers: {
            "User-Agent": `${my.name}/${my.version}`
        }
    }

    /*  determine proxy-related HTTP fetching parameters  */
    let proxy = getProxy()
    if (proxy === null) {
        const result = await npmExecute([ "config", "get", "proxy" ]).catch(() => null)
        if (result !== null) {
            const stdout = result.stdout.toString().replace(/\r?\n$/, "")
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
            arch:     "*",
            platform: "*",
            name:     "",
            extract:  false,
            strip:    0,
            output:   "."
        }, request)

        /*  filter on architecture  */
        if (!micromatch.all(process.arch, request.arch.split(",")))
            continue

        /*  filter on platform  */
        if (!micromatch.all(process.platform, request.platform.split(",")))
            continue

        /*  sanity check usage  */
        if (request.filter && !request.extract)
            throw new Error("option \"filter\" requires option \"extract\"")
        if (request.map && !request.extract)
            throw new Error("option \"map\" requires option \"extract\"")
        if (request.strip && !request.extract)
            throw new Error("option \"strip\" requires option \"extract\"")

        /*  download the resource  */
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
        const data = await new Promise((resolve, reject) => {
            const begin = Date.now()
            const req = got(request.input, Object.assign({}, httpOpts, { responseType: "buffer" }))
            req.on("downloadProgress", (progress) => {
                if (process.stdout.isTTY) {
                    let percent = ""
                    if (progress.total)
                        percent = `(${chalk.blue(((progress.transferred / progress.total) * 100).toFixed(0) + "%")}) `
                    let speed = (progress.transferred / ((Date.now() - begin) / 1000))
                    if (speed > 1000 * 1000 * 1000)
                        speed = (speed / (1000 * 1000 * 1000)).toFixed(1) + "GB/s"
                    else if (speed > 1000 * 1000)
                        speed = (speed / (1000 * 1000)).toFixed(1) + "MB/s"
                    else if (speed > 1000)
                        speed = (speed / 1000).toFixed(1) + "KB/s"
                    else
                        speed = speed.toFixed(0) + "B/s"
                    display(`\r${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                        `${chalk.blue(filesize(progress.transferred))} bytes ${percent}received ` +
                        `with ${chalk.blue(speed)}...     \b\b\b\b`)
                }
            })
            req.then((response) => {
                if (process.stdout.isTTY)
                    display(`\r${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                        `${chalk.blue(filesize(response.body.length))} bytes received.                        \n`)
                else
                    display(`${glyphicon.gear.unicode} ${chalk.reset("download:")} ` +
                        `${chalk.blue(filesize(response.body.length))} bytes received.\n`)
                resolve(response.body)
            }).catch((err) => {
                if (process.stdout.isTTY)
                    display("\n")
                reject(new Error(`download failed: ${err}`))
            })
        })

        /*  generate output  */
        const stat = await fs.stat(request.output).catch(() => null)
        if (!request.extract) {
            /*  save single file  */
            if (stat !== null && stat.isDirectory()) {
                const url = new URL(request.input)
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
                const patterns = filter
                filter = (path) => {
                    let take = (patterns[0][0] === "!")
                    patterns.forEach((pattern) => {
                        const negate = (pattern[0] === "!")
                        if (negate)
                            pattern = pattern.substr(1)
                        if (micromatch.isMatch(path, pattern))
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
                const mappings = map
                map = (path) => {
                    mappings.forEach((mapping) => {
                        path = path.replace(mapping[0], mapping[1])
                    })
                    return path
                }
            }
            const files = await decompress(data, request.output, {
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

