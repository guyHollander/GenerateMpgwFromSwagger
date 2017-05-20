const fs = require('fs');
const https = require('https')
// configurationFile
var config = JSON.parse(fs.readFileSync('config.json'));
// Rest Mananegment int objects
const romaObj = JSON.parse(fs.readFileSync('romaObj.json'));
// options for roma request
const romaReqOptions = {
  hostname: config.restMngIntConfig.host,
  port: config.restMngIntConfig.port,
  method: 'POST',
  rejectUnauthorized: false,
  auth: config.restMngIntConfig.auth,
  headers: {
  'Content-Type': 'application/json'
  }
};

function rmiRequest(obj ,options, callback){
  // Rest requst method

  const req = https.request(options, (res) => {
    res.setEncoding('utf8');
    var resBody = '';
    res.on('data', (chunk) => {
      resBody = resBody + chunk;
    });
    res.on('end', () => {
      callback(resBody, res.statusCode);
    });
  });
  //
  req.write(JSON.stringify(obj));
  req.end();
}

module.exports = {

  createMpgw: function (name, fsh, policy, remoteHost, callback){

    var mpgwObj = romaObj.MultiProtocolGateway;
    mpgwObj.name = name;
    mpgwObj.FrontProtocol.value = fsh;
    mpgwObj.StylePolicy.value = policy;
    mpgwObj.BackendUrl = remoteHost;
    reqObj = {"MultiProtocolGateway" : mpgwObj};

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/MultiProtocolGateway';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});

  },

  createPolicy: function(name, rulesArray, callback){
    // build rule json object for roma
    var policyObj = romaObj.StylePolicy;
    policyObj.name = name;
    policyObj.PolicyMaps = rulesArray;
    reqObj = {"StylePolicy" : policyObj};

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/StylePolicy';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});

  },

  createHttpFsh: function(name, port, localAddress, callback) {
    // build fsh json object for roma
    var httpFshObj = romaObj.HTTPSourceProtocolHandler;
    httpFshObj.name = name;
    httpFshObj.LocalPort = port;
    httpFshObj.LocalAddress = localAddress;

    reqObj = {
      "HTTPSourceProtocolHandler": httpFshObj
    }

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/HTTPSourceProtocolHandler';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});
  },

  createHttpsFsh: function(name, port, localAddress, sslObjectType, sslObjectName,callback) {
    // build fsh json object for roma
    var httpsFshObj = romaObj.HTTPSSourceProtocolHandler;
    httpsFshObj.name = name;
    httpsFshObj.LocalPort = port;
    httpsFshObj.LocalAddress = localAddress;
    httpsFshObj.SSLServerConfigType = sslObjectType;
    switch (sslObjectType) {
      case 'proxy':
        httpsFshObj.SSLProxy = {"value" : sslObjectName};
        break;

        case 'server':
          httpsFshObj.SSLServer = {"value" : sslObjectName};
          break;
        case 'sni':
            httpsFshObj.SSLSNIServer = {"value" : sslObjectName};
            break;
      default:
        throw 'Invalid SSL Server Object type';

    }

    reqObj = {
      "HTTPSSourceProtocolHandler": httpsFshObj
    }

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/HTTPSSourceProtocolHandler';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});
  },

  createRule: function(name, direction, actionName, callback){
    // build rule json object for roma
    var ruleObj = romaObj.StylePolicyRule;
    ruleObj.name = name;
    ruleObj.Direction = direction + '-rule';
    ruleObj.Actions.value = actionName;
    reqObj = {"StylePolicyRule" : ruleObj};

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/StylePolicyRule';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});

  },

  createRuleAction: function(name,callback){
    // build rule action json object for rmi.
    // currently create only Result action
    var actionObj = romaObj.StylePolicyAction;
    actionObj.name = name;
    reqObj = {"StylePolicyAction":actionObj};

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/StylePolicyAction';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});

  },

  createMatchingRule: function(name, url, callback){
    // build matching rule json object for roma
    var matchObj = romaObj.Matching;
    matchObj.name = name;
    matchObj.MatchRules.Url = url;
    reqObj = {"Matching":matchObj};

    // set url path of the roma request
    var options = romaReqOptions;
    options.path = '/mgmt/config/' + config.mpgwConfig.domain + '/Matching';

    rmiRequest(reqObj, options, (res, statusCode) =>{callback(statusCode)});

  }

}
