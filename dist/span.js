'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class BasicSpan {
    constructor(tracer, _ref) {
        let operationName = _ref.operationName;
        let parent = _ref.parent;
        let tags = _ref.tags;
        var _ref$startTime = _ref.startTime;
        let startTime = _ref$startTime === undefined ? Date.now() : _ref$startTime;

        this._tracer = tracer;

        this.operationName = operationName;

        if (parent) {
            this.traceId = parent.traceId;
            this.spanId = _nodeUuid2.default.v4();
            this.parentId = parent.spanId;
            this.baggage = parent.baggage;
        } else {
            this.traceId = _nodeUuid2.default.v4();
            this.spanId = _nodeUuid2.default.v4();
            this.parentId = undefined;
            this.baggage = undefined;
        }
        this.sampled = this._tracer.isSample(this, parent);

        this.tags = tags;

        this.startTime = startTime;
    }
    /**
     * Returns the Tracer object used to create this Span.
     *
     * @return {Tracer}
     */
    tracer() {
        return this._tracer;
    }
    /**
     * Sets the string name for the logical operation this span represents.
     *
     * @param {string} name
     */
    setOperationName(name) {
        this.operationName = name;
    }
    /**
     * Adds a single tag to the span.  See `AddTags()` for details.
     *
     * @param {string} key
     * @param {any} value
     */
    setTag(key, value) {
        if (!this.tags) {
            this.tags = {};
        }
        this.tags[key] = value;
    }
    /**
     * Adds the given key value pairs to the set of span tags.
     *
     * Multiple calls to addTags() results in the tags being the superset of
     * all calls.
     *
     * The behavior of setting the same key multiple times on the same span
     * is undefined.
     *
     * The supported type of the values is implementation-dependent.
     * Implementations are expected to safely handle all types of values but
     * may choose to ignore unrecognized / unhandle-able values (e.g. objects
     * with cyclic references, function objects).
     *
     * @return {[type]} [description]
     */
    addTags(keyValuePairs) {
        for (let key in keyValuePairs) {
            this.setTag(key, keyValuePairs[key]);
        }
    }
    /**
     * Set an arbitrary key-value string pair that will be carried along the
     * full path of a trace.
     *
     * All spans created as children of this span will inherit the baggage items
     * of this span.
     *
     * Baggage items are copied between all spans, both in-process and across
     * distributed requests, therefore this feature should be used with care to
     * ensure undue overhead is not incurred.
     *
     * Keys are case insensitive and must match the regular expresssion
     * `[a-z0-9][-a-z0-9]*`.
     *
     * @param {string} key
     * @param {string} value
     */
    setBaggageItem(key, value) {
        if (!this.baggage) {
            this.baggage = {};
        }
        this.baggage[key] = value;
    }
    /**
     * Returns the value for the given baggage item key.
     *
     * @param  {string} key
     *         The key for the given trace attribute.
     * @return {string}
     *         String value for the given key, or undefined if the key does not
     *         correspond to a set trace attribute.
     */
    getBaggageItem(key) {
        if (this.baggage) {
            return this.baggage[key];
        }
        return undefined;
    }
    /**
     * Explicitly create a log record associated with the span.
     *
     * @param  {[type]} fields [description]
     * @param  {object} fields
     *         Optional associative array of fields.
     *         - `timestamp` {Number} Optional field specifying the timestamp
     *              in milliseconds as a Unix timestamp. Fractional values are
     *              allowed so that timestamps with sub-millisecond accuracy
     *              can be represented. If not specified, the implementation
     *              is expected to use it's notion of the current time of the
     *              call.
     *         - `event` {string}
     *              The event name.
     *         - `payload` {object}
     *              An arbitrary structured payload. It is implementation-dependent
     *              how this will be processed.
     */
    log(_ref2) {
        let event = _ref2.event;
        let payload = _ref2.payload;
        var _ref2$timestamp = _ref2.timestamp;
        let timestamp = _ref2$timestamp === undefined ? Date.now() : _ref2$timestamp;

        if (!this.tags) {
            this.tags = [];
        }
        this.tags.push({
            event,
            payload,
            timestamp
        });
    }
    /**
     * Indicates that the unit of work represented by the span is complete or
     * has otherwise been terminated.
     *
     * All Span objects must have finish() called on them before they are
     * reported to the backend implementation.
     *
     * Once `finish()` is called on a Span object, the behavior of all methods
     * on the object is considered undefined.
     *
     * @param  {Number} finishTime
     *         Optional finish time in milliseconds as a Unix timestamp. Decimal
     *         values are supported for timestamps with sub-millisecond accuracy.
     *         If not specified, the current time (as defined by the
     *         implementation) will be used.
     */
    finish() {
        let finishTime = arguments.length <= 0 || arguments[0] === undefined ? Date.now() : arguments[0];

        this.duration = finishTime - this.startTime;
        this._tracer.record(this);
    }
}
exports.default = BasicSpan;