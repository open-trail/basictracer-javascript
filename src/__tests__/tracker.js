'use strict'

let inf = require('opentracing')
let Tracer = require('../tracer')

let tracer = new Tracer()
tracer.setInterface(inf)

const OPERATION_NAME = 'basictracer-test'
const ANOTHER_OPERATION_NAME = 'another-basictracer-test'

describe('Tracer', () => {
    it('should setup format constants', () => {
        tracer.FORMAT_TEXT_MAP.should.be.ok
        tracer.FORMAT_BINARY.should.be.ok
    })

    it('should create root span', () => {
        let rootSpan = tracer.startSpan(OPERATION_NAME)
        rootSpan.traceId.should.be.ok
        rootSpan.spanId.should.be.ok
        rootSpan.parentId.should.be.not.ok
        rootSpan.sampled.should.be.type('boolean')
        rootSpan.baggage.should.not.be.ok
    })

    it('should inject context into carrier', () => {
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let carrier = {}
        tracer.inject(parentSpan, tracer.FORMAT_TEXT_MAP, carrier)
        carrier.should.eql({
            traceId: parentSpan.traceId,
            parentId: parentSpan.spanId,
            sampled: parentSpan.sampled,
            baggage: parentSpan.baggage,
        })
    })

    it('should join receving span', () => {
        // inject
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let carrier = {baggage: {key: 'value'}}
        tracer.inject(parentSpan, tracer.FORMAT_TEXT_MAP, carrier)

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME, tracer.FORMAT_TEXT_MAP,
                               carrier)
        span.traceId.should.eql(parentSpan.traceId)
        span.spanId.should.not.eql(parentSpan.spanId)
        span.parentId.should.eql(parentSpan.spanId)
        span.sampled.should.eql(parentSpan.sampled)
        span.baggage.should.eql(parentSpan.baggage)
    })

    it('should able to in process span creation', () => {
        let parentSpan = tracer.startSpan(OPERATION_NAME)
        let span = tracer.startSpan(ANOTHER_OPERATION_NAME,
                                    {parent: parentSpan})
        span.traceId.should.eql(parentSpan.traceId)
        span.spanId.should.not.eql(parentSpan.spanId)
        span.parentId.should.eql(parentSpan.spanId)
        span.sampled.should.eql(parentSpan.sampled)
        span.baggage.should.eql(parentSpan.baggage)
    })
})
