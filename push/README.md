Push API
========

Development
-----------

    bundle install
    bundle exec rackup

Production
----------

    bundle install
    RACK_ENV=production bundle exec rackup

Endpoints
=========

POST /push
----------

### Description

Creates a new notification

### Parameters

    Field       Required      Type      Description
    message     true          String    The message to appear in the dialog
    pairs       false         Array     An array of key/value pair hashes
                                        e.g. [{key: 'foo', value: 'bar'}]

### Example

`curl -X POST "http://localhost:9292/push" -F 'message=Hello, world!' -F 'pairs=[{"key": "key1", "value": "value1"}]'`
