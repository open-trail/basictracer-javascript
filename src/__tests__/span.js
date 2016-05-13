'use strict'

let inf = require('opentracing')
let Tracer = require('../tracer')
let Span = require('../span')

let tracer = new Tracer()
tracer.setInterface(inf)

const OPERATION_NAME = 'basictracer-test'
const ANOTHER_OPERATION_NAME = 'another-basictracer-test'

describe('Span', () => {
    it('should construct a new span', () => {
        let context = {
            traceId: 'fake-traceId',
            parentId: 'fake-parentId',
            sampled: true,
        }
        let tags = {key: 'value'}
        let span = new Span(tracer, {
            operationName: OPERATION_NAME,
            context,
            tags,
        })
        span.operationName.should.eql(OPERATION_NAME)
        // should auto create timestamp
        span.startTime.should.be.type('number')
        span.duration.should.not.be.ok
        span.tags.should.eql(tags)
        // not referrence copy
        span.tags.should.not.equal(tags)
        span.logs.should.not.be.ok

        span.traceId.should.eql(context.traceId)
        span.spanId.should.be.type('string')
        span.parentId.should.equal(context.parentId)
        span.sampled.should.eql(context.sampled)
        span.baggage.should.not.be.ok
    })

    it('should create root span', () => {
        let rootSpan = new Span(tracer, {operationName: OPERATION_NAME})
        rootSpan.operationName.should.eql(OPERATION_NAME)
        rootSpan.startTime.should.be.type('number')
        rootSpan.duration.should.not.be.ok
        rootSpan.tags.should.not.be.ok
        rootSpan.logs.should.not.be.ok

        rootSpan.traceId.should.be.type('string')
        rootSpan.spanId.should.be.type('string')
        rootSpan.parentId.should.be.not.ok
        rootSpan.sampled.should.eql(true)
        rootSpan.baggage.should.not.be.ok
    })

    it('should allow change operationName', () => {
        let span = new Span(tracer, OPERATION_NAME)
        span.operationName.should.eql(OPERATION_NAME)
        span.setOperationName(ANOTHER_OPERATION_NAME)
        span.operationName.should.eql(ANOTHER_OPERATION_NAME)
    })

    it('should set and update span tag', () => {
        let span = new Span(tracer, OPERATION_NAME)
        span.tags.should.not.be.ok

        span.setTag('key', 'value')
        span.tags.should.be.type('object')
        span.tags.key.should.eql('value')

        span.setTag('key', 'anotherValue')
        span.tags.key.should.eql('anotherValue')

        span.addTags({anotherKey: 'ops'})
        span.tags.should.eql({
            key: 'anotherValue',
            anotherKey: 'ops',
        })
    })

    it('should set and get baggage', () => {
        let span = new Span(tracer, OPERATION_NAME)
        span.tags.should.not.be.ok

        span.setBaggageItem('key', 'value')
        span.baggage.should.be.type('object')
        span.baggage.key.should.eql('value')
        span.getBaggageItem('key').should.eql('value')
    })

    it('should create timestamped log entry', () => {
        let span = new Span(tracer, OPERATION_NAME)
        span.logs.should.not.be.ok

        span.log({
            event: 'read',
            payload: {duration: 1000},
        })
        span.logs.should.be.type('array')
        span.logs[0].timestamp.should.be.type('number')
        span.logs[0].event.should.eql('read')
        span.logs[0].payload.should.eql({duration: 1000})
    })

    it('should end span', () => {
        let span = new Span(tracer, OPERATION_NAME)
        span.startTime.should.be.type('number')
        span.duration.should.not.be.ok
        span.finish()
        span.duration.should.be.type('number')
    })
})
