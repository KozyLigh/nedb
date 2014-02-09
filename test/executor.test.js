var should = require('chai').should()
  , assert = require('chai').assert
  , testDb = 'workspace/test.db'
  , fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , async = require('async')
  , model = require('../lib/model')
  , Datastore = require('../lib/datastore')
  , Persistence = require('../lib/persistence')
  ;


// Test that even if a callback throws an exception, the next DB operations will still be executed
// We prevent Mocha from catching the exception we throw on purpose by remembering all current handlers, remove them and register them back after test ends
function testThrowInCallback (d, done) {
  var currentUncaughtExceptionHandlers = process.listeners('uncaughtException');
  
  process.removeAllListeners('uncaughtException');

  process.on('uncaughtException', function (err) {
    // Do nothing with the error which is only there to test we stay on track
  });

  d.find({}, function (err) {    
    process.nextTick(function () {
      d.insert({ bar: 1 }, function (err) {
        for (var i = 0; i < currentUncaughtExceptionHandlers.length; i += 1) {
          process.on('uncaughtException', currentUncaughtExceptionHandlers[i]);
        }
        
        done();
      });
    });
    
    throw 'Some error';
  });
}


// Test that operations are executed in the right order
// We prevent Mocha from catching the exception we throw on purpose by remembering all current handlers, remove them and register them back after test ends
function testRightOrder (d, done) {
  var currentUncaughtExceptionHandlers = process.listeners('uncaughtException');
  
  process.removeAllListeners('uncaughtException');

  process.on('uncaughtException', function (err) {
    // Do nothing with the error which is only there to test we stay on track
  });

  d.find({}, function (err) {    
    process.nextTick(function () {
      d.insert({ bar: 1 }, function (err) {
        for (var i = 0; i < currentUncaughtExceptionHandlers.length; i += 1) {
          process.on('uncaughtException', currentUncaughtExceptionHandlers[i]);
        }
        
        done();
      });
    });
    
    throw 'Some error';
  });
}  
  
  

describe('Executor', function () {

  describe.only('With persistent database', function () {
    var d;

    beforeEach(function (done) {
      d = new Datastore({ filename: testDb });
      d.filename.should.equal(testDb);
      d.inMemoryOnly.should.equal(false);

      async.waterfall([
        function (cb) {
          Persistence.ensureDirectoryExists(path.dirname(testDb), function () {
            fs.exists(testDb, function (exists) {
              if (exists) {
                fs.unlink(testDb, cb);
              } else { return cb(); }
            });
          });
        }
      , function (cb) {
          d.loadDatabase(function (err) {
            assert.isNull(err);
            d.getAllData().length.should.equal(0);
            return cb();
          });
        }
      ], done);
    });

    it('A throw in a callback doesnt prevent execution of next operations', function(done) {
      testThrowInCallback(d, done);
    });
  
  });   // ==== End of 'With persistent database' ====


  describe('With non persistent database', function () {
    var d;

    beforeEach(function (done) {
      d = new Datastore({ inMemoryOnly: true });
      d.inMemoryOnly.should.equal(true);

      d.loadDatabase(function (err) {
        assert.isNull(err);
        d.getAllData().length.should.equal(0);
        return cb();
      });
    });

    it('A throw in a callback doesnt prevent execution of next operations', function(done) {
      testThrowInCallback(d, done);
    });
  
  });   // ==== End of 'With non persistent database' ====

});
