'use strict';

var _opentracing = require('opentracing');

var _opentracing2 = _interopRequireDefault(_opentracing);

var _tracer = require('../tracer');

var _tracer2 = _interopRequireDefault(_tracer);

var _propagation = require('../propagation');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let tracer = new _tracer2.default();
tracer.setInterface(_opentracing2.default);
let textMapPropagator = new _propagation.TextMapPropagator(tracer);
let binaryPropagator = new _propagation.BinaryPropagator(tracer);

const OPERATION_NAME = 'basictracer-test';

describe('BinaryPropagator', () => {
    it('should inject into buffer field', () => {
        let span = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = {};
        binaryPropagator.inject(span, carrier);
        carrier.buffer.should.be.type('string');
    });

    it('should link span via carrier', () => {
        let span = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = {};
        binaryPropagator.inject(span, carrier);

        let childSpan = binaryPropagator.join(OPERATION_NAME, carrier);
        childSpan.traceId.should.eql(span.traceId);
        childSpan.spanId.should.not.eql(span.spanId);
        childSpan.parentId.should.eql(span.spanId);
        childSpan.sampled.should.eql(span.sampled);
        childSpan.baggage.should.eql(span.baggage);
    });
});

describe('TextMapPropagator', () => {
    it('should inject into buffer field', () => {
        let span = tracer.startSpan({ operationName: OPERATION_NAME });
        span.setBaggageItem('key', 'value');
        let carrier = {};
        textMapPropagator.inject(span, carrier);
        carrier.traceId.should.be.type('string');
        carrier.spanId.should.be.type('string');
        carrier.sampled.should.be.type('boolean');
        carrier.baggage.should.be.type('object');
        carrier.baggage.key.should.eql('value');
    });

    it('should link span via carrier', () => {
        let span = tracer.startSpan({ operationName: OPERATION_NAME });
        let carrier = {};
        textMapPropagator.inject(span, carrier);

        let childSpan = textMapPropagator.join(OPERATION_NAME, carrier);
        childSpan.traceId.should.eql(span.traceId);
        childSpan.spanId.should.not.eql(span.spanId);
        childSpan.parentId.should.eql(span.spanId);
        childSpan.sampled.should.eql(span.sampled);
        childSpan.baggage.should.eql(span.baggage);
    });

    it('should report corrupted trace with invalid carrier', () => {
        let carrierMissingRequired = {
            traceId: undefined,
            spanId: 'hello',
            sampled: true
        }(() => {
            textMapPropagator.join(OPERATION_NAME, carrierMissingRequired);
        }).should.throw();

        let carrierInvalidSample = {
            traceId: 'hello',
            spanId: 'world',
            sampled: 'notTrue'
        }(() => {
            textMapPropagator.join(OPERATION_NAME, carrierInvalidSample);
        }).should.throw();
    });
});