# serverless-plugin-tracing

[![npm version](https://badge.fury.io/js/serverless-plugin-tracing.svg)](https://badge.fury.io/js/serverless-plugin-tracing)
[![CircleCI](https://circleci.com/gh/AlexanderMS/serverless-plugin-tracing.svg?style=shield)](https://circleci.com/gh/AlexanderMS/serverless-plugin-tracing)
[![Coverage Status](https://coveralls.io/repos/github/AlexanderMS/serverless-plugin-tracing/badge.svg)](https://coveralls.io/github/AlexanderMS/serverless-plugin-tracing)

Enables AWS X-Ray (https://aws.amazon.com/xray/) for the entire Serverless stack or individual functions.

**Update**: as of `2.0.0`, plugin uses Cloud Formation to update `TracingConfig` and no longer
makes additional AWS SDK calls. No cange to YAML contract: stays same as in 1.x
Tested with `serverless@1.22.0`.

Note: this plugin is currently **Beta**.

Note: 1.x was tested to work well with `serverless@1.13.2`. Some older versions of `serverless`
may not work due to outdated Javascript SDK that
does not support `TracingConfig`.

`npm install --save-dev serverless-plugin-tracing`

Example `serverless.yml`:

```yaml
service: my-great-service

provider:
  name: aws
  stage: test
  tracing: true # enable tracing
  iamRoleStatements:
    - Effect: "Allow" # xray permissions (required)
      Action:
        - "xray:PutTraceSegments"
        - "xray:PutTelemetryRecords"
      Resource:
        - "*"

plugins:
  - serverless-plugin-tracing

functions:
  mainFunction: # inherits tracing settings from "provider"
    handler: src/app/index.handler
  healthcheck:
    tracing: false # overrides provider settings (opt out)
```

Output after `serverless deploy`:
```
Serverless: Tracing ENABLED for function
  "my-great-service-test-mainFunction"
Serverless: Tracing DISABLED for function
  "my-great-service-test-healthcheck"
```

**Important**: in addition to using the plugin, you need to enable capturing
traces in the code as well:

```javascript
const awsXRay = require('aws-xray-sdk');
const awsSdk = awsXRay.captureAWS(require('aws-sdk'));
```

The plugin only controls the checkbox that be viewed in AWS Console:
go to AWS Lambda -> select a Lambda function -> Configuration tab -> Advanced settings ->
"Enable active tracing". If `tracing` ends up being `true` for a function,
the checkbox will be checked for that function.
