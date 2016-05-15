'use strict';

var _opentracing = require('opentracing');

var _opentracing2 = _interopRequireDefault(_opentracing);

var _tracer = require('../tracer');

var _tracer2 = _interopRequireDefault(_tracer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let tracer = new _tracer2.default();
tracer.setInterface(_opentracing2.default);

const FORMAT_TEXT_MAP = _opentracing2.default.FORMAT_TEXT_MAP;

const OPERATION_NAME = 'basictracer-test';
const ANOTHER_OPERATION_NAME = 'another-basictracer-test';

describe('Tracer', () => {
    it('should create root span', () => {
        let rootSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        should(rootSpan.traceId).be.ok();
        should(rootSpan.spanId).be.ok();
        should(rootSpan.parentId.equals(rootSpan.spanId)).be.ok();
        should(rootSpan.sampled).be.type('boolean');
        should(rootSpan.baggage).be.type('object');
    });

    it('should inject context into carrier', () => {
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = {};
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier);
        should(Object.keys(carrier).length).eql(3);
    });

    it('should join receving span', () => {
        // inject
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = { baggage: { key: 'value' } };
        tracer.inject(parentSpan, FORMAT_TEXT_MAP, carrier);

        // join
        let span = tracer.join(ANOTHER_OPERATION_NAME, FORMAT_TEXT_MAP, carrier);
        should(span.traceId.equals(parentSpan.traceId)).be.ok();
        should(span.spanId.equals(parentSpan.spanId)).be.not.ok();
        should(span.parentId.equals(parentSpan.spanId)).be.ok();
        should(span.sampled).eql(parentSpan.sampled);
        should(span.baggage).eql(parentSpan.baggage);
    });

    it('should able to in process span creation', () => {
        let parentSpan = tracer.startSpan({ operationName: OPERATION_NAME });
        let span = tracer.startSpan({
            operationName: ANOTHER_OPERATION_NAME,
            parent: parentSpan
        });
        should(span.traceId.equals(parentSpan.traceId)).be.ok();
        should(span.spanId.equals(parentSpan.spanId)).be.not.ok();
        should(span.parentId.equals(parentSpan.spanId)).be.ok();
        should(span.sampled).eql(parentSpan.sampled);
        should(span.baggage).be.type('object');
    });
});