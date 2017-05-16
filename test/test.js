'use strict';

const
  sinon = require('sinon'),
  assert = require('chai').assert,
  Plugin = require('../index');

describe('serverless-plugin-tracing', function() {
  let sandbox, logSpy, requestSpy, serverlessBaseInstance;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    logSpy = sandbox.spy();
    requestSpy = sandbox.spy();
    serverlessBaseInstance = {
      service: {
        service: 'myService',
        functions: {
        },
        provider: {
          stage: 'test'
        }
      },
      cli: {
        log: logSpy
      },
      getProvider: () => ({
        request: requestSpy
      })
    };
  });

  function runPlugin(params) {
    const serverlessInstance = Object.assign({}, serverlessBaseInstance);
    serverlessInstance.service.provider = Object.assign({},
      serverlessInstance.service.provider,
      params.provider);

    serverlessInstance.service.functions = params.functions;
    const plugin = new Plugin(serverlessInstance);
    plugin.hooks['after:deploy:deploy'].call(plugin);
    return plugin;
  }

  afterEach(function() {
    sandbox.verifyAndRestore();
  });

  it('enables tracing when function.tracing=true', function() {
    runPlugin({
      functions: {
        healthcheck: {
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing DISABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(requestSpy.getCall(0).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-healthcheck',
        TracingConfig: {
          Mode: 'PassThrough'
        }
      }
    ]);

    assert.deepEqual(requestSpy.getCall(1).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-mainFunction',
        TracingConfig: {
          Mode: 'Active'
        }
      }
    ]);
  });

  it('enables tracing when provider.tracing=true', function() {
    runPlugin({
      functions: {
        healthcheck: {
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
        tracing: true
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing ENABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(requestSpy.getCall(0).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-healthcheck',
        TracingConfig: {
          Mode: 'Active'
        }
      }
    ]);

    assert.deepEqual(requestSpy.getCall(1).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-mainFunction',
        TracingConfig: {
          Mode: 'Active'
        }
      }
    ]);
  });

  it('does not enable tracing when provider.tracing=true but function.tracing=false', function() {
    runPlugin({
      functions: {
        healthcheck: {
          tracing: false
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
        tracing: true
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing DISABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(requestSpy.getCall(0).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-healthcheck',
        TracingConfig: {
          Mode: 'PassThrough'
        }
      }
    ]);

    assert.deepEqual(requestSpy.getCall(1).args, [
      'Lambda',
      'updateFunctionConfiguration',
      {
        FunctionName: 'myService-test-mainFunction',
        TracingConfig: {
          Mode: 'Active'
        }
      }
    ]);
  });
});
