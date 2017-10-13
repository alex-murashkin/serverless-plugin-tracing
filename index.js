'use strict';

module.exports = class TracingConfigPlugin {
   constructor(serverless, options) {
     this.serverless = serverless;
     this.options = options;
     this.hooks = {
       'package:compileEvents': this.processTracing.bind(this)
     };
   }

   processTracing() {
     const service = this.serverless.service;
     this.functionResources = Object.keys(service.provider.compiledCloudFormationTemplate.Resources)
      .reduce((acc, resourceId) => {
        const resource = service.provider.compiledCloudFormationTemplate.Resources[resourceId];
        if (resource.Type === "AWS::Lambda::Function") {
          if (resource.Properties) {
            acc[resource.Properties.FunctionName] = resource;
          }
        }
        return acc;
      }, {});
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
    if (!this.functionResources[functionName]) {
      this.serverless.cli.log(`Tracing NOT SET for function "${functionName}" as couldn't find it in Cloud Formation template`);
      return;
    }
    this.serverless.cli.log(`Tracing ${isEnabled ? 'ENABLED' : 'DISABLED'} for function "${functionName}"`);
    this.functionResources[functionName].Properties.TracingConfig = {
      Mode: isEnabled === true ? 'Active' : 'PassThrough'
    };
  }
};
