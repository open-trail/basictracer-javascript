'use strict';

var _opentracing = require('opentracing');

var _opentracing2 = _interopRequireDefault(_opentracing);

var _tracer = require('../tracer');

var _tracer2 = _interopRequireDefault(_tracer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let tracer = new _tracer2.default();
tracer.setInterface(_opentracing2.default);

const FORMAT_TEXT_MAP = _opentracing2.default.FORMAT_TEXT_MAP;
const FORMAT_BINARY = _opentracing2.default.FORMAT_BINARY;

const OPERATION_NAME = 'basictracer-test';
const ANOTHER_OPERATION_NAME = 'another-basictracer-test';

describe('Tracer', () => {
    it('should create root span', () => {
        let rootSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        rootSpan.traceId.should.be.ok;
        rootSpan.spanId.should.be.ok;
        rootSpan.parentId.should.be.not.ok;
        rootSpan.sampled.should.be.type('boolean')(rootSpan.baggage === undefined).should.be.ok;
    });

    it('should inject context into carrier', () => {
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = {};
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier);
        carrier.should.eql({
            traceId: parentSpan.traceId,
            parentId: parentSpan.spanId,
            sampled: parentSpan.sampled,
            baggage: parentSpan.baggage
        });
    });

    it('should join receving span', () => {
        // inject
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = { baggage: { key: 'value' } };
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier);

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME, FORMAT_TEXT_MAP, carrier);
        span.traceId.should.eql(parentSpan.traceId);
        span.spanId.should.not.eql(parentSpan.spanId);
        span.parentId.should.eql(parentSpan.spanId);
        span.sampled.should.eql(parentSpan.sampled);
        span.baggage.should.eql(parentSpan.baggage);
    });

    it('should able to in process span creation', () => {
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let span = tracer.startSpan({
            operationName: ANOTHER_OPERATION_NAME,
            parent: parentSpan
        });
        span.traceId.should.eql(parentSpan.traceId);
        span.spanId.should.not.eql(parentSpan.spanId);
        span.parentId.should.eql(parentSpan.spanId);
        span.sampled.should.eql(parentSpan.sampled)(span.baggage === undefined).should.be.ok;
    });
});