'use strict';

const
  sinon = require('sinon'),
  assert = require('chai').assert,
  Plugin = require('../index');

describe('serverless-plugin-tracing', function() {
  let sandbox, logSpy, serverlessBaseInstance;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    logSpy = sandbox.spy();
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
      }
    };
  });

  function runPlugin(params) {
    const serverlessInstance = Object.assign({}, serverlessBaseInstance);
    serverlessInstance.service.provider = Object.assign({},
      serverlessInstance.service.provider,
      params.provider);

    serverlessInstance.service.functions = params.functions;
    const options = { stage: 'test', noDeploy: params.noDeploy };
    const plugin = new Plugin(serverlessInstance, options);
    plugin.hooks['package:compileEvents'].call(plugin);
    return plugin;
  }

  afterEach(function() {
    sandbox.verifyAndRestore();
  });

  it('enables tracing when function.tracing=true', function() {
    const plugin = runPlugin({
      functions: {
        healthcheck: {
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
        compiledCloudFormationTemplate: require('./cf-template-basic.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing DISABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-basic-enabled-one.json'));
  });

  it('enables tracing when provider.tracing=true', function() {
    const plugin = runPlugin({
      functions: {
        healthcheck: {
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
        tracing: true,
        compiledCloudFormationTemplate: require('./cf-template-basic.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing ENABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-basic-enabled-both.json'));
  });

  it('enables tracing when opt variable is "true"', function() {
    const plugin = runPlugin({
      functions: {
        healthcheck: {
          tracing: 'false'
        },
        mainFunction: {
          tracing: 'true'
        }
      },
      provider: {
        tracing: 'true',
        compiledCloudFormationTemplate: require('./cf-template-basic.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing DISABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-basic-enabled-one.json'));
  });

  it('does not enable tracing when provider.tracing=true but function.tracing=false', function() {
    const plugin = runPlugin({
      functions: {
        healthcheck: {
          tracing: false
        },
        mainFunction: {
          tracing: true
        }
      },
      provider: {
        tracing: true,
        compiledCloudFormationTemplate: require('./cf-template-basic.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing DISABLED for function "myService-test-healthcheck"');
    assert.deepEqual(logSpy.getCall(1).args[0], 'Tracing ENABLED for function "myService-test-mainFunction"');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-basic-enabled-one.json'));
  });

  it('respects the name property', function() {
    const plugin = runPlugin({
      functions: {
        mainFunction: {
          name: 'custom-name',
          tracing: true
        }
      },
      provider: {
        compiledCloudFormationTemplate: require('./cf-template-custom-name.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing ENABLED for function "custom-name"');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-custom-name-enabled.json'));
  });

  it('does not change functions that could not be found', function() {
    const plugin = runPlugin({
      functions: {
        mainFunction: {
          name: 'notFound',
          tracing: true
        }
      },
      provider: {
        compiledCloudFormationTemplate: require('./cf-template-custom-name.json')
      }
    });

    assert.deepEqual(logSpy.getCall(0).args[0], 'Tracing NOT SET for function "notFound" as couldn\'t find it in Cloud Formation template');
    assert.deepEqual(plugin.serverless.service.provider.compiledCloudFormationTemplate, require('./cf-template-custom-name-not-changed.json'));
  });
});
