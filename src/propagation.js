'use strict'

import BasicSpan from './span'

class BinaryPropagator {
    constructor(tracer) {
        this._tracer = tracer
    }

    inject(span, carrier) {
        try {
            carrier.buffer = JSON.stringify({
                traceId: span.traceId,
                spanId: span.spanId,
                sampled: span.sampled,
                baggage: span.baggage,
            })
        } catch (err) {
            throw new Error('Trace corrupted, unable to parse binary carrier')
        }
    }

    join(operationName, carrier) {
        let parent = JSON.parse(carrier.buffer)
        return new BasicSpan(this._tracer, {
            operationName,
            parent,
        })
    }
}

const PREFIX_TRACER_STATE = 'ot-tracer-'
const PREFIX_BAGGAGE = 'ot-baggage-'
const FIELD_NAME_TRACE_ID = PREFIX_TRACER_STATE + 'traceid'
const FIELD_NAME_SPAN_ID = PREFIX_TRACER_STATE + 'spanid'
const FIELD_NAME_SAMPLED = PREFIX_TRACER_STATE + 'sampled'
const FIELD_COUNT = 3

class TextMapPropagator {
    constructor(tracer) {
        this._tracer = tracer
    }

    inject(span, carrier) {
        carrier[FIELD_NAME_TRACE_ID] = span.traceId
        carrier[FIELD_NAME_SPAN_ID] = span.spanId
        carrier[FIELD_NAME_SAMPLED] = String(span.sampled)
        for (let key in span.baggage) {
            carrier[PREFIX_BAGGAGE + key] = span.baggage[key]
        }
    }

    join(operationName, carrier) {
        let parent = {}
        let count = 0
        for (let field in carrier) {
            if (field === FIELD_NAME_TRACE_ID) {
                parent.traceId = carrier[field]
                count += 1
            } else if (field === FIELD_NAME_SPAN_ID) {
                parent.spanId = carrier[field]
                count += 1
            } else if (field === FIELD_NAME_SAMPLED) {
                if (carrier[field] !== 'true' &&
                    carrier[field] !== 'false') {
                    throw new Error('Trace corrupted, sampled should be type ' +
                                    `Boolean, got ${carrier[field]}`)
                }
                parent.sampled = Boolean(carrier[field])
                count += 1
            } else if (field.indexOf(PREFIX_BAGGAGE) === 0) {
                if (!parent.baggage) {
                    parent.baggage = {}
                }
                parent.baggage[field.slice(PREFIX_BAGGAGE.length)] =
                    carrier[field]
            }
        }
        if (count !== FIELD_COUNT) {
            throw new Error('Trace corrupted, ' +
                            'require traceId, spanId and sampled')
        }
        return new BasicSpan(this._tracer, {
            operationName,
            parent,
        })
    }
}

module.exports = {
    BinaryPropagator,
    TextMapPropagator,
}
