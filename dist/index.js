'use strict';

var _opentracing = require('opentracing');

var _opentracing2 = _interopRequireDefault(_opentracing);

var _tracer = require('./tracer');

var _tracer2 = _interopRequireDefault(_tracer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_opentracing2.default.configure = options => {
    _opentracing2.default.initGlobalTracer(new _tracer2.default(options));
};

module.exports = _opentracing2.default;