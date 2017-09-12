'use strict';

module.exports = class TracingConfigPlugin {
   constructor(serverless, options) {
     this.serverless = serverless;
     this.options = options;
     this.aws = serverless.getProvider('aws');
     this.hooks = {
       'after:deploy:deploy': this.processTracing.bind(this)
     };
   }

   processTracing() {
     const service = this.serverless.service;
     const stage = this.options.stage;
     const providerLevelTracingEnabled = (service.provider.tracing === true || service.provider.tracing === 'true');
     return Promise.all(Object.keys(service.functions).map(functionName => {
        return this.toggleTracing(
          service.functions[functionName].name || `${service.service}-${stage}-${functionName}`,
          service.functions[functionName].tracing === true
          || service.functions[functionName].tracing === 'true'
          || (providerLevelTracingEnabled && (service.functions[functionName].tracing !== false && service.functions[functionName].tracing !== 'false'))
        );
     }));
  }

  toggleTracing(functionName, isEnabled) {
    this.serverless.cli.log(`Tracing ${isEnabled ? 'ENABLED' : 'DISABLED'} for function "${functionName}"`);
    return this.aws.request('Lambda', 'updateFunctionConfiguration', {
      FunctionName: functionName,
      TracingConfig: {
        Mode: isEnabled === true ? 'Active' : 'PassThrough'
      }
    });
  }
};
