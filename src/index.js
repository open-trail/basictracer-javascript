'use strict'

let tracer = require('opentracing')
let Backend = require('./tracer')

tracer.configure = (options) => {
    tracer.initGlobalTracer(new Backend(options))
}

module.exports = tracer
