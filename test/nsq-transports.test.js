/* Copyright (c) 2014-2015 Richard Rodger */
"use strict";


// mocha nsq-transport.test.js

var test = require('seneca-transport-test')


describe('nsq-transport', function() {

  it('happy-any', function( fin ) {
    test.foo_test( 'nsq-transport', require, fin, 'nsq', -4150 )
  })

  it('happy-pin', function( fin ) {
    test.foo_pintest( 'nsq-transport', require, fin, 'nsq', -4150 )
  })

})
