'use strict'

import Span from './span'
import {TextMapPropagator, BinaryPropagator} from './propagation'
import {DefaultSampler} from './sampler'
import {DefaultRecorder, DebuggingRecorder} from './recorder'
import constants from './constants'

const isTest = process.env.NODE_ENV === 'test'

// Implement https://github.com/opentracing/opentracing-javascript/blob/master/src/tracer.js
export default class Tracer {
    constructor() {
        this._sampler = new DefaultSampler()
        this._recorder = isTest ?
            new DebuggingRecorder() : new DefaultRecorder()
        this._binaryPropagator = new BinaryPropagator(this)
        this._textPropagator = new TextMapPropagator(this)
    }

    /**
     * Configure sampler and recorder
     * @param  {Object} options
     *         Optional associative array of fields.
     *         - `sampler` {Sampler} Optional object with `isSample` method, the
     *             method provided with current span as arguments, return
     *             Boolean value indicate whether should take current span
     *             as sample. See src/sample.js for example.
     *         - `recorder` {Recorder} Optional object with `record` method, the
     *             method take span and do whatever required to record a span.
     *             See src/recorder.js for example.
     */
    configure({sampler, recorder} = {}) {
        if (sampler) {
            this._sampler = sampler
        }
        if (recorder) {
            this._recorder = recorder
        }
    }

    /**
     * Starts and returns a new Span representing a logical unit of work.
     *
     * @param  {string} operationName Required
     *         The name of the the operation from the perpsective of the current
     *         service.
     *
     * @param  {string|object} fields Optional
     *         It is treated as a set of fields to set on the newly created span.
     *
     *         - `parent` {Span}  Optional. The newly created Span will be created
     *              as a child of `parent`.
     *         - `tags` {object} Optional set of key-value pairs which will be set as
     *              tags on the newly created Span. Ownership of the object is
     *              passed to the created span and the caller for efficiency
     *              reasons.
     *         - `startTime` {Number} Optional manually specified start time for the
     *              created Span object. The time should be specified in
     *              milliseconds as Unix timestamp. Decimal value are supported
     *              to represent time values with sub-millisecond accuracy.
     *
     * @return {Span}
     *         A new Span object.
     */
    startSpan(operationName, fields = {}) {
        return new Span(this, {
            operationName,
            parent: fields.parent,
            startTime: fields.startTime,
            tags: fields.tags,
        })
    }

    /**
     * Injects the information about the given span into the carrier
     * so that the span can propogate across inter-process barriers.
     *
     * See FORMAT_TEXT_MAP and FORMAT_BINARY for the two required carriers.
     *
     * Consider this pseudocode example:
     *
     *     var clientSpan = ...;
     *     ...
     *     // Inject clientSpan into a text carrier.
     *     var textCarrier = {};
     *     Tracer.inject(clientSpan, Tracer.FORMAT_TEXT_MAP, textCarrier);
     *     // Incorporate the textCarrier into the outbound HTTP request header
     *     // map.
     *     outboundHTTPReq.headers.extend(textCarrier);
     *     // ... send the httpReq
     *
     * For FORMAT_BINARY, inject() will set the buffer field to an Array-like
     * (Array, ArrayBuffer, or TypedBuffer) object containing the injected
     * binary data.  Any valid Object can be used as long as the buffer field of
     * the object can be set.
     *
     * @param  {Span} span
     *         The span whose information should be injected into the carrier.
     * @param  {string} format
     *         The format of the carrier.
     * @param  {any} carrier
     *         See the method description for details on the carrier object.
     */
    inject(span, format, carrier) {
        if (format === constants.FORMAT_TEXT_MAP) {
            this._textPropagator.inject(span, carrier)
        } else if (format === constants.FORMAT_BINARY) {
            this._binaryPropagator.inject(span, carrier)
        }
    }

    /**
     * Returns a new Span object with the given operation name using the trace
     * information from the carrier.
     *
     * See FORMAT_TEXT_MAP and FORMAT_BINARY for the two required carriers.
     *
     * Consider this pseudocode example:
     *
     *     // Use the inbound HTTP request's headers as a text map carrier.
     *     var textCarrier = inboundHTTPReq.headers;
     *     var serverSpan = Tracer.join(
     *         "operation name", Tracer.FORMAT_TEXT_MAP, textCarrier);
     *
     * For FORMAT_BINARY, `carrier` is expected to have a field named `buffer`
     * that contains an Array-like object (Array, ArrayBuffer, or TypedBuffer).
     *
     * @param  {string} operationName
     *         Operation name to use on the newly created span.
     * @param  {string} format
     *         The format of the carrier.
     * @param  {any} carrier
     *         The type of the carrier object is determined by the format.
     * @return {Span}
     */
    join(operationName, format, carrier) {
        let span
        if (format === constants.FORMAT_TEXT_MAP) {
            span = this._textPropagator.join(operationName, carrier)
        } else if (format === constants.FORMAT_BINARY) {
            span = this._binaryPropagator.join(operationName, carrier)
        }
        return span
    }

    _isSampled(span) {
        return this._sampler.isSampled(span)
    }
    _record(span) {
        return this._recorder.record(span)
    }
}
