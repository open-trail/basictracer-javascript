'use strict'

import BasicSpan from './span'
import {TextMapPropagator, BinaryPropagator} from './propagation'
import Sampler from './sampler'
import Recorder from './recorder'

export default class BasicTracer {
    constructor({sampler, recorder} = {}) {
        this._sampler = sampler || new Sampler()
        this._recorder = recorder || new Recorder()
        this._binaryPropagator = new BinaryPropagator(this)
        this._textPropagator = new TextMapPropagator(this)
    }
    setInterface(inf) {
        this._interface = inf
    }
    /**
     * Starts and returns a new Span representing a logical unit of work.
     *
     * @param  {string|object} fields
     *         A set of fields to set on the newly created span.
     *
     *         - `operationName` {string} Required. This is the name to use for
     *              the newly created span.
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
    startSpan(fields) {
        // Interface or Implementation argument
        // https://github.com/opentracing/opentracing-javascript/pull/29
        if (fields.parent && typeof fields.parent.imp === 'function') {
            fields.parent = fields.parent.imp()
        }
        return new BasicSpan(this, {
            operationName: fields.operationName,
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
        if (format === this._interface.FORMAT_TEXT_MAP) {
            this._textPropagator.inject(span, carrier)
        } else if (format === this._interface.FORMAT_BINARY) {
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
        if (format === this._interface.FORMAT_TEXT_MAP) {
            span = this._textPropagator.join(operationName, carrier)
        } else if (format === this._interface.FORMAT_BINARY) {
            span = this._binaryPropagator.join(operationName, carrier)
        }
        return span
    }

    isSample(span, parent) {
        return this._sampler.isSample(span, parent)
    }
    record(span) {
        this._recorder.record(span)
    }
}
