'use strict'

export class DefaultRecorder {
    record(span) { // eslint-disable-line

    }
}

export class DebuggingRecorder extends DefaultRecorder {
    record(span) {
        console.log(JSON.stringify({ // eslint-disable-line
            operationName: span.operationName,
            startTime: span.startTime,
            duration: span.duration,
            tags: span.tags,
            logs: span.logs,

            traceId: span.traceId.toString(),
            spanId: span.spanId.toString(),
            parentId: span.parentId.toString(),
            sampled: span.sampled,
            baggage: span.baggage,
        }))
    }
}
