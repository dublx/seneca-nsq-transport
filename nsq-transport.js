/* Copyright (c) 2014-2015 Luis Faustino, MIT License */
"use strict";

var util   = require('util')

var _        = require('lodash')
var nsq      = require('nsqjs')


module.exports = function( options ) {
  var seneca = this
  var plugin = 'nsq-transport'

  var so = seneca.options()

  options = seneca.util.deepextend(
    {
      nsq: {
        timeout:  so.timeout ? so.timeout-555 :  22222,
        type:     'nsq',
        host:     'localhost',
        port:     4150,
      },
    },
    so.transport,
    options)


  var tu = seneca.export('transport/utils')


  seneca.add({role:'transport',hook:'listen',type:'nsq'}, hook_listen_nsq)
  seneca.add({role:'transport',hook:'client',type:'nsq'}, hook_client_nsq)

  // Legacy patterns
  seneca.add({role:'transport',hook:'listen',type:'pubsub'}, hook_listen_nsq)
  seneca.add({role:'transport',hook:'client',type:'pubsub'}, hook_client_nsq)



  function hook_listen_nsq( args, done ) {

    var seneca         = this
    var type           = args.type
    var listen_options = seneca.util.clean(_.extend({},options[type],args))


    tu.listen_topics( seneca, args, listen_options, function(topic) {

      var actTopic = topic + '_act';


  
      seneca.log.info('listen', 'open', listen_options, seneca)
      seneca.log.info('listen', 'subscribe', actTopic, seneca)

      var listenReader  = new nsq.Reader(actTopic, 'seneca_listen_in', {nsqdTCPAddresses: listen_options.host + ':' + listen_options.port});
      var listenWriter = new nsq.Writer(listen_options.host, listen_options.port);
      handle_reader_events(listenReader)
      handle_writer_events(listenWriter)
      listenReader.connect();
      listenWriter.connect();

      listenReader.on('message', function (msg) {
        var resTopic = actTopic.replace(/_act$/,'_res')
        var data     = tu.parseJSON( seneca, 'listen-'+type, msg.body )
        msg.finish();
        tu.handle_request( seneca, data, listen_options, function(out){
          if( null == out ) return;
          var outstr = tu.stringifyJSON( seneca, 'listen-'+type, out )
          listenWriter.publish(resTopic, outstr)
        })
      });


      seneca.add('role:seneca,cmd:close',function( close_args, done ) {
        var closer = this

        listenReader.close()
        listenWriter.close()
        closer.prior(close_args,done)
      })
    

    })


    done()
  }


  function hook_client_nsq( args, clientdone ) {
    var seneca         = this
    var type           = args.type
    var client_options = seneca.util.clean(_.extend({},options[type],args))

    tu.make_client( make_send, client_options, clientdone )

    function make_send( spec, topic, send_done ) {
      var actTopic = topic + "_act"
      var resTopic = topic + "_res"
      var clientReader  = new nsq.Reader(resTopic, 'seneca_client_in', {nsqdTCPAddresses: client_options.host + ':' + client_options.port});
      var clientWriter = new nsq.Writer(client_options.host, client_options.port);
      handle_reader_events(clientReader)
      handle_writer_events(clientWriter)
      clientReader.connect();
      clientWriter.connect();

      clientReader.on('message',function(msg){
        var input = tu.parseJSON(seneca,'client-'+type,msg.body)
        msg.finish();
        tu.handle_response( seneca, input, client_options )
      })


      send_done( null, function( args, done ) {
        var outmsg = tu.prepare_request( this, args, done )
        var outstr = tu.stringifyJSON( seneca, 'client-'+type, outmsg )
        clientWriter.publish( actTopic, outstr, function publishCb(err) {
        } )
      })


      seneca.add('role:seneca,cmd:close',function( close_args, done ) {
        var closer = this

        clientReader.close()
        clientWriter.close()
        closer.prior(close_args,done)
      })
    }
  }


  function handle_reader_events( reader ) {
    reader.on('error', function(err){
      seneca.log.error('transport','nsq',err)
    })
  }

  function handle_writer_events( writer ) {
    // Die if you can't connect initially
    writer.on('ready', function() {
      writer.on('error', function(err){
        seneca.log.error('transport','nsq',err)
      })
    })

  }

  return {
    name: plugin,
  }
}
