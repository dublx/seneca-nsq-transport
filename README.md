# seneca-nsq-transport - a [Seneca](http://senecajs.org) plugin

## Seneca Nsq.io Transport Plugin

This plugin provides the Nsq.io pub/sub transport channel for
micro-service messages. This lets you send broadcast messsages via [Nsq.io](http://nsq.io/).

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this plugin module, feel free to contact me on twitter if you
have any questions! :) [@luisfaustino](http://twitter.com/luisfaustino)

Current Version: 1.0.0

Tested on: Seneca 0.6.1, Node 0.12.0


### Install

```sh
npm install seneca-nsq-transport
```

You'll also need [nsq](http://nsq.io/).


## Quick Example

```js
require('seneca')()
  .use('nsq-transport')
  .add('foo:two',function(args,done){ done(null,{bar:args.bar}) })
  .client( {type:'nsq',pin:'foo:one,bar:*'} )
  .listen( {type:'nsq',pin:'foo:two,bar:*'} )
```



