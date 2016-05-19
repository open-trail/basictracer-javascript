'use strict'

import Tracer from './tracer'
import Span from './span'
import constants from './constants'

let tracer = new Tracer()

tracer.Tracer = Tracer
tracer.Span = Span

for (let key in constants) {
    tracer[key] = constants[key]
}

module.exports = tracer
