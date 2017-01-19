'use strict';

var setup = require('../../../controller/search'),
    mockBackend = require('../mock/backend'),
    mockQuery = require('../mock/query');
var proxyquire =  require('proxyquire').noCallThru();

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('valid interface', function(t) {
    t.equal(typeof setup, 'function', 'setup is a function');
    t.equal(typeof setup(), 'function', 'setup returns a controller');
    t.end();
  });
};

module.exports.tests.success = function(test, common) {
  test('successful request to search service should set data and meta', (t) => {
    const config = {
      indexName: 'indexName value'
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return {
        body: 'this is the query body',
        type: 'this is the query type'
      };
    };

    // request timeout messages willl be written here
    const infoMesssages = [];

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        t.equal(esclient, 'this is the esclient');
        t.deepEqual(cmd, {
          index: 'indexName value',
          searchType: 'dfs_query_then_fetch',
          body: 'this is the query body'
        });

        const docs = [{}, {}];
        const meta = { key: 'value' };

        callback(undefined, docs, meta);
      },
      'pelias-logger': {
        get: (service) => {
          t.equal(service, 'api');
          return {
            info: (msg) => {
              infoMesssages.push(msg);
            },
            debug: () => {}
          };
        }
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.deepEqual(req, {
        clean: {},
        errors: [],
        warnings: []
      });
      t.deepEquals(res.data, [{}, {}]);
      t.deepEquals(res.meta, { key: 'value', query_type: 'this is the query type' });

      t.ok(infoMesssages.find((msg) => {
        return msg === '[controller:search] [queryType:this is the query type] [es_result_count:2]';
      }));
      t.end();
    };

    controller(req, res, next);

  });

  test('undefined meta should set empty object into res', (t) => {
    const config = {
      indexName: 'indexName value'
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return {
        body: 'this is the query body',
        type: 'this is the query type'
      };
    };

    // request timeout messages willl be written here
    const infoMesssages = [];

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        t.equal(esclient, 'this is the esclient');
        t.deepEqual(cmd, {
          index: 'indexName value',
          searchType: 'dfs_query_then_fetch',
          body: 'this is the query body'
        });

        const docs = [{}, {}];

        callback(undefined, docs, undefined);
      },
      'pelias-logger': {
        get: (service) => {
          t.equal(service, 'api');
          return {
            info: (msg) => {
              infoMesssages.push(msg);
            },
            debug: () => {}
          };
        }
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.deepEqual(req, {
        clean: {},
        errors: [],
        warnings: []
      });
      t.deepEquals(res.data, [{}, {}]);
      t.deepEquals(res.meta, { query_type: 'this is the query type' });

      t.ok(infoMesssages.find((msg) => {
        return msg === '[controller:search] [queryType:this is the query type] [es_result_count:2]';
      }));
      t.end();
    };

    controller(req, res, next);

  });

  test('undefined docs should log 0 results', (t) => {
    const config = {
      indexName: 'indexName value'
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return {
        body: 'this is the query body',
        type: 'this is the query type'
      };
    };

    // request timeout messages willl be written here
    const infoMesssages = [];

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        t.equal(esclient, 'this is the esclient');
        t.deepEqual(cmd, {
          index: 'indexName value',
          searchType: 'dfs_query_then_fetch',
          body: 'this is the query body'
        });

        const meta = { key: 'value' };

        callback(undefined, undefined, meta);
      },
      'pelias-logger': {
        get: (service) => {
          t.equal(service, 'api');
          return {
            info: (msg) => {
              infoMesssages.push(msg);
            },
            debug: () => {}
          };
        }
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.deepEqual(req, {
        clean: {},
        errors: [],
        warnings: []
      });
      t.equals(res.data, undefined);
      t.deepEquals(res.meta, { key: 'value', query_type: 'this is the query type' });

      t.ok(infoMesssages.find((msg) => {
        return msg === '[controller:search] [queryType:this is the query type] [es_result_count:0]';
      }));
      t.end();
    };

    controller(req, res, next);

  });

  test('successful request on retry to search service should log info message', (t) => {
    const config = {
      indexName: 'indexName value'
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return {
        body: 'this is the query body',
        type: 'this is the query type'
      };
    };

    let searchServiceCallCount = 0;

    const timeoutError = {
      status: 408,
      displayName: 'RequestTimeout',
      message: 'Request Timeout after 17ms'
    };

    // request timeout messages willl be written here
    const infoMesssages = [];

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        t.equal(esclient, 'this is the esclient');
        t.deepEqual(cmd, {
          index: 'indexName value',
          searchType: 'dfs_query_then_fetch',
          body: 'this is the query body'
        });

        if (searchServiceCallCount < 2) {
          // note that the searchService got called
          searchServiceCallCount++;
          callback(timeoutError);
        } else {
          const docs = [{}, {}];
          const meta = { key: 'value' };

          callback(undefined, docs, meta);
        }

      },
      'pelias-logger': {
        get: (service) => {
          t.equal(service, 'api');
          return {
            info: (msg) => {
              infoMesssages.push(msg);
            },
            debug: () => {}
          };
        }
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.deepEqual(req, {
        clean: {},
        errors: [],
        warnings: []
      });
      t.deepEquals(res.data, [{}, {}]);
      t.deepEquals(res.meta, { key: 'value', query_type: 'this is the query type' });

      t.ok(infoMesssages.find((msg) => {
        return msg === '[controller:search] [queryType:this is the query type] [es_result_count:2]';
      }));

      t.ok(infoMesssages.find((msg) => {
        return msg === 'succeeded on retry 2';
      }));

      t.end();
    };

    controller(req, res, next);

  });

};

module.exports.tests.timeout = function(test, common) {
  test('default # of request timeout retries should be 3', (t) => {
    const config = {
      indexName: 'indexName value'
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return { body: 'this is the query body' };
    };

    let searchServiceCallCount = 0;

    const timeoutError = {
      status: 408,
      displayName: 'RequestTimeout',
      message: 'Request Timeout after 17ms'
    };

    // request timeout messages willl be written here
    const infoMesssages = [];

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        t.equal(esclient, 'this is the esclient');
        t.deepEqual(cmd, {
          index: 'indexName value',
          searchType: 'dfs_query_then_fetch',
          body: 'this is the query body'
        });

        // not that the searchService got called
        searchServiceCallCount++;

        callback(timeoutError);
      },
      'pelias-logger': {
        get: (service) => {
          t.equal(service, 'api');
          return {
            info: (msg) => {
              infoMesssages.push(msg);
            },
            debug: () => {}
          };
        }
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.equal(searchServiceCallCount, 3+1);

      t.ok(infoMesssages.indexOf('request timed out on attempt 1, retrying') !== -1);
      t.ok(infoMesssages.indexOf('request timed out on attempt 2, retrying') !== -1);
      t.ok(infoMesssages.indexOf('request timed out on attempt 3, retrying') !== -1);

      t.deepEqual(req, {
        clean: {},
        errors: [timeoutError.message],
        warnings: []
      });
      t.deepEqual(res, {});
      t.end();
    };

    controller(req, res, next);

  });

  test('explicit apiConfig.requestRetries should retry that many times', (t) => {
    const config = {
      indexName: 'indexName value',
      requestRetries: 17
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return { };
    };

    let searchServiceCallCount = 0;

    const timeoutError = {
      status: 408,
      displayName: 'RequestTimeout',
      message: 'Request Timeout after 17ms'
    };

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        // not that the searchService got called
        searchServiceCallCount++;

        callback(timeoutError);
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.equal(searchServiceCallCount, 17+1);
      t.end();
    };

    controller(req, res, next);

  });

  test('only status code 408 should be considered a retryable request', (t) => {
    const config = {
      indexName: 'indexName value',
      requestRetries: 17
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return { };
    };

    let searchServiceCallCount = 0;

    const nonTimeoutError = {
      status: 500,
      displayName: 'InternalServerError',
      message: 'an internal server error occurred'
    };

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        // not that the searchService got called
        searchServiceCallCount++;

        callback(nonTimeoutError);
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.equal(searchServiceCallCount, 1);
      t.deepEqual(req, {
        clean: {},
        errors: [nonTimeoutError.message],
        warnings: []
      });
      t.end();
    };

    controller(req, res, next);

  });

  test('string error should not retry and be logged as-is', (t) => {
    const config = {
      indexName: 'indexName value',
      requestRetries: 17
    };
    const esclient = 'this is the esclient';
    const query = () => {
      return { };
    };

    let searchServiceCallCount = 0;

    const stringTypeError = 'this is an error string';

    // a controller that validates the esclient and cmd that was passed to the search service
    const controller = proxyquire('../../../controller/search', {
      '../service/search': (esclient, cmd, callback) => {
        // not that the searchService got called
        searchServiceCallCount++;

        callback(stringTypeError);
      }
    })(config, esclient, query);

    const req = { clean: { }, errors: [], warnings: [] };
    const res = {};

    var next = function() {
      t.equal(searchServiceCallCount, 1);
      t.deepEqual(req, {
        clean: {},
        errors: [stringTypeError],
        warnings: []
      });
      t.end();
    };

    controller(req, res, next);

  });

};

module.exports.tests.existing_errors = function(test, common) {
  test('req with errors should not call backend', function(t) {
    var esclient = function() {
      throw new Error('esclient should not have been called');
    };
    var controller = setup( {}, esclient, mockQuery() );

    // the existence of `errors` means that a sanitizer detected an error,
    //  so don't call the esclient
    var req = {
      errors: ['error']
    };
    var res = { };

    t.doesNotThrow(() => {
      controller(req, res, () => {});
    });
    t.end();

  });

};

module.exports.tests.existing_results = function(test, common) {
  test('res with existing data should not call backend', function(t) {
    var esclient = function() {
      throw new Error('backend should not have been called');
    };
    var controller = setup( {}, esclient, mockQuery() );

    var req = { };
    // the existence of `data` means that there are already results so
    // don't call the backend/query
    var res = { data: [{}] };

    var next = function() {
      t.deepEqual(res, {data: [{}]});
      t.end();
    };
    controller(req, res, next);

  });

};

module.exports.tests.undefined_query = function(test, common) {
  test('query returning undefined should not call service', function(t) {
    // a function that returns undefined
    var query = function () { return; };

    var search_service_was_called = false;

    var controller = proxyquire('../../../controller/search', {
      '../service/search': function() {
        search_service_was_called = true;
        throw new Error('search service should not have been called');
      }
    })(undefined, undefined, query);

    var next = function() {
      t.notOk(search_service_was_called, 'should have returned before search service was called');
      t.end();
    };

    controller({}, {}, next);

  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('GET /search ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};
