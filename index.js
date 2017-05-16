'use strict';

module.exports = class TracingConfigPlugin {
   constructor(serverless) {
     this.serverless = serverless;
     this.aws = serverless.getProvider('aws');
     this.hooks = {
       'after:deploy:deploy': this.processTracing.bind(this)
     };
   }

   processTracing() {
     const service = this.serverless.service;
     const providerLevelTracingEnabled = (service.provider.tracing === true);
     Object.keys(service.functions).forEach(functionName => {
        this.toggleTracing(`${service.service}-${service.provider.stage}-${functionName}`,
          (service.functions[functionName].tracing === true)
          || (providerLevelTracingEnabled && service.functions[functionName].tracing !== false)
        );
     });
  }

  toggleTracing(functionName, isEnabled) {
    this.serverless.cli.log(`Tracing ${isEnabled ? 'ENABLED' : 'DISABLED'} for function "${functionName}"`);
    this.aws.request('Lambda', 'updateFunctionConfiguration', {
      FunctionName: functionName,
      TracingConfig: {
        Mode: isEnabled === true ? 'Active' : 'PassThrough'
      }
    });
  }
};
