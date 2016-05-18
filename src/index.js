'use strict'

import Tracer from './tracer'
import Span from './span'
import {DefaultSampler} from './sampler'
import {DefaultRecorder} from './recorder'

let tracer = new Tracer()

tracer.DefaultSampler = DefaultSampler
tracer.DefaultRecorder = DefaultRecorder
tracer.Tracer = Tracer
tracer.Span = Span

module.exports = tracer
