"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Recorder {
    record(span) {
        console.log(JSON.stringify({
            operationName: span.operationName,
            startTime: span.startTime,
            duration: span.duration,
            tags: span.tags,
            logs: span.logs,

            traceId: span.traceId,
            spanId: span.spanId,
            parentId: span.parentId,
            sampled: span.sampled,
            baggage: span.baggage
        }));
    }
}
exports.default = Recorder;