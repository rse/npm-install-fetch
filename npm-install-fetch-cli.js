#!/usr/bin/env node
/*!
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
const fs         = require("fs")
const path       = require("path")

/*  external requirements  */
const yargs      = require("yargs")
const chalk      = require("chalk")
const yaml       = require("js-yaml")
const traverse   = require("traverse")

/*  local requirements  */
const fetch      = require("./npm-install-fetch-api.js")

;(async () => {
    /*  load my package information  */
    const my = require("./package.json")

    /*  command-line option parsing  */
    const argv = yargs
        /* eslint indent: off */
        .usage("Usage: $0 [-h] [-V] [-c <file>] [-a <arch>] [-p <platform>] [-n <name>] [-e] [-f <filter>] [-m <map-from>:<map-to>] [-s <number>] [-o <file>] [<input>]")
        .help("h").alias("h", "help").default("h", false)
            .describe("h", "show usage help")
        .boolean("V").alias("V", "version").default("V", false)
            .describe("V", "show program version information")
        .string("c").alias("c", "config").default("c", "npm-install-fetch.yaml")
            .describe("c", "path to YAML configuration file")
        .string("a").alias("a", "arch").default("a", "*")
            .describe("a", "ensure system architecture matches")
        .string("p").alias("p", "platform").default("p", "*")
            .describe("p", "ensure system platform matches")
        .string("n").alias("n", "name").default("n", "")
            .describe("n", "name of resource")
        .boolean("e").alias("e", "extract").default("e", false)
            .describe("e", "extract archive to individual files")
        .string("f").nargs("f", 1).alias("f", "filter")
            .describe("f", "filter extracted file(s) [requires extract option]")
        .string("m").alias("m", "map")
            .describe("m", "map extracted file paths [requires extract option]")
        .number("s").alias("s", "strip")
            .describe("s", "strip top-level directories from extracted files [requires extract option]")
        .string("o").alias("o", "output")
            .describe("o", "output directory or file")
        .version(false)
        .strict()
        .showHelpOnFail(true)
        .demand(0)
        .parse(process.argv.slice(2))

    /*  short-circuit processing of "-V" command-line option  */
    if (argv.version) {
        process.stderr.write(`${my.name} ${my.version} <${my.homepage}>\n`)
        process.stderr.write(`${my.description}\n`)
        process.stderr.write(`Copyright (c) 2018-2020 ${my.author.name} <${my.author.url}>\n`)
        process.stderr.write(`Licensed under ${my.license} <http://spdx.org/licenses/${my.license}.html>\n`)
        process.exit(0)
    }

    /*  start assembling fetching request(s)  */
    let requests = []

    /*  take over CLI options  */
    if (argv._.length === 1) {
        const options = {}
        if (argv._.length === 1) options.input    = argv._[0]
        if (argv.arch)           options.arch     = argv.arch
        if (argv.platform)       options.platform = argv.platform
        if (argv.name)           options.name     = argv.name
        if (argv.extract)        options.extract  = argv.extract
        if (argv.filter)         options.filter   = argv.filter
        if (argv.strip)          options.strip    = argv.strip
        if (argv.output)         options.output   = argv.output
        if (argv.map) {
            let list = argv.map
            if (typeof list === "string")
                list = [ list ]
            options.map = []
            list.forEach((mapping) => {
                options.map.push(mapping.split(/:/))
            })
        }
        requests.push(options)
    }

    /*  load package.json entry  */
    let file = path.resolve(process.cwd(), "package.json")
    let pkg = {}
    if (fs.existsSync(file)) {
        pkg = require(file)
        if (pkg.name === "npm-install-fetch")
            pkg = {}
        if (typeof pkg["npm-install-fetch"] === "object") {
            if (pkg["npm-install-fetch"] instanceof Array)
                requests = requests.concat(pkg["npm-install-fetch"])
            else
                requests.push(pkg["npm-install-fetch"])
        }
    }

    file = path.resolve(process.cwd(), argv.config)
    if (fs.existsSync(file)) {
        const obj = yaml.safeLoad(fs.readFileSync(file, { encoding: "utf8" }))
        if (typeof obj === "object") {
            if (obj instanceof Array)
                requests = requests.concat(obj)
            else
                requests.push(obj)
        }
    }

    /*  sanity check situation  */
    if (requests.length === 0)
        throw new Error("no resources given")

    /*  expand variables from "package.json"  */
    requests = traverse(requests).map(function (val) {
        if (typeof val === "string") {
            const valNew = val.replace(/%\{(.+?)\}/g, (m, name) => {
                let result = m
                if (typeof pkg[name] === "string")
                    result = pkg[name]
                return result
            })
            if (valNew !== val)
                this.update(valNew)
        }
    })

    /*  pass-through execution to API  */
    await fetch(requests)
})().catch((err) => {
    /*  fatal error  */
    process.stderr.write(`npm-install-fetch: ${chalk.red("ERROR:")} ${err.message}\n`)
    process.exit(1)
})

