"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class DefaultSampler {
    isSample(span, parent) {
        if (parent) {
            return parent.sampled;
        }
        return true;
    }
}
exports.default = DefaultSampler;