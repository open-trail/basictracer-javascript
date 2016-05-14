'use strict'

import inf from 'opentracing'
import Tracer from '../tracer'

let tracer = new Tracer()
tracer.setInterface(inf)

const FORMAT_TEXT_MAP = inf.FORMAT_TEXT_MAP

const OPERATION_NAME = 'basictracer-test'
const ANOTHER_OPERATION_NAME = 'another-basictracer-test'

describe('Tracer', () => {
    it('should create root span', () => {
        let rootSpan = tracer.startSpan({operationName: OPERATION_NAME})
        should(rootSpan.traceId).be.ok()
        should(rootSpan.spanId).be.ok()
        should(rootSpan.parentId).be.not.ok()
        should(rootSpan.sampled).be.type('boolean')
        should(rootSpan.baggage).not.be.ok()
    })

    it('should inject context into carrier', () => {
        let parentSpan = tracer.startSpan({operationName: OPERATION_NAME})
        let carrier = {}
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier)
        should(Object.keys(carrier).length).eql(3)
    })

    it('should join receving span', () => {
        // inject
        let parentSpan = tracer.startSpan({operationName: OPERATION_NAME})
        let carrier = {baggage: {key: 'value'}}
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier)

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME, FORMAT_TEXT_MAP,
                               carrier)
        should(span.traceId).eql(parentSpan.traceId)
        should(span.spanId).not.eql(parentSpan.spanId)
        should(span.parentId).eql(parentSpan.spanId)
        should(span.sampled).eql(parentSpan.sampled)
        should(span.baggage).eql(parentSpan.baggage)
    })

    it('should able to in process span creation', () => {
        let parentSpan = tracer.startSpan({operationName: OPERATION_NAME})
        let span = tracer.startSpan({
            operationName: ANOTHER_OPERATION_NAME,
            parent: parentSpan,
        })
        should(span.traceId).eql(parentSpan.traceId)
        should(span.spanId).not.eql(parentSpan.spanId)
        should(span.parentId).eql(parentSpan.spanId)
        should(span.sampled).eql(parentSpan.sampled)
        should(span.baggage).not.be.ok()
    })
})
