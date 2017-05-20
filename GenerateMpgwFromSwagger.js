const fs = require('fs')
const SwaggerParser = require('swagger-parser');
// Rest mng int model
const rmiFunctions = require('./rmiFunctions.js')
// configuration
var config = JSON.parse(fs.readFileSync('config.json'));

/******* global variabls **********/

var apiObj = {};
var apiHost = '';
var apiProtocol;
var apiName = '';
var basePath = '';
var policyName = '';

/******* Functions *****************/


function createPRules(path, callback){
/** create a pair of Proccessing policy rules for 'path', and the depended properties.
    in case of duplicated values, failed
 **/

  console.log('begin to build Proccessing rule for path %s', path);
  // naming this path rule's object
  var name = path.slice(1).replace(/\//g, '.').replace(/[{}]/g, '');
  //  create match action for api path
  var matchName = policyName + '_'  + name + '_Match';
  var urlMatch = basePath + path + '*'

  rmiFunctions.createMatchingRule(matchName, urlMatch, (resCode)=>{
      if(resCode != 200 && resCode != 201){
        console.log(' fail to create Matching Rule for %s', name);
      };
  });

  /* create a generic Proccesing rules (requst and response),
    then an policy map object containig both the rules and the match */
    var policyMap = [];
    var ruleDirection = ['request', 'response']

    ruleDirection.forEach((dire)=>
    {
      var ruleName = policyName + '_' + name + '_' + dire + '_rule';
      var resultActionName = ruleName + '_results';

      // create result action for current rule
      rmiFunctions.createRuleAction(resultActionName, (resCode)=>{
        if(resCode != '200' && resCode !='201'){
          console.log(' fail to create result action')
        } else {
            // if successfully create Result action, creates proccesing rule
            // var ruleMapJson = {"Match": {"value": matchName}, "Rule":{"value": ruleName}};
            // policyMap.push(ruleMapJson);
            rmiFunctions.createRule(ruleName, dire, resultActionName, (resCode)=> {
              if(resCode != '200' && resCode !='201'){
                console.log(' fail to create Rule  %s', name);
            } else {
              var ruleMapJson = {"Match": {"value": matchName}, "Rule":{"value": ruleName}};
              policyMap.push(ruleMapJson);
              if(policyMap.length == 2){callback(policyMap)};
            };

          });
        }
      });

    });
}

function createMpgw(mappedRulesArray){
  /***** Create MultiProtocolGateway service and its depended Objects *****/

  /* MultiProtocolGateway params */
  var fshName = '';
  var remoteHost = apiProtocol + '://' + apiHost;
  // frontSideHandler
  if(config.mpgwConfig.sslFrontSideHandler){
    fshName = 'HTTPS_' + config.mpgwConfig.localPort + '_FSH';
    rmiFunctions.createHttpsFsh(fshName, config.mpgwConfig.localPort, config.mpgwConfig.localHost, config.mpgwConfig.sslObjectType, config.mpgwConfig.sslObjectName, (resCode)=>{
      if(resCode != '200' && resCode !='201'){
        console.log('fail to create front side handler');
      } else {
        console.log('successfully create Front side handler');
      };
    });
  } else {
    fshName = 'HTTP_' + config.mpgwConfig.localPort + '_FSH';
    rmiFunctions.createHttpFsh(fshName, config.mpgwConfig.localPort, config.mpgwConfig.localHost,(resCode)=>{
      if(resCode != '200' && resCode !='201'){
      console.log('fail to create front side handler');
      } else {
        console.log('successfully create Front side handler');
      };
    });
  }

  // Proccessing Policy
  rmiFunctions.createPolicy(policyName, mappedRulesArray, (resCode)=>{
    if(resCode != '200' && resCode !='201'){
       console.log('fail to create ProcessingPolicy');
    } else {
      console.log('successfully create Proccessing Policy');
      rmiFunctions.createMpgw(apiName, fshName, policyName, remoteHost, (resCode)=>{
        if(resCode != '200' && resCode !='201'){
           console.log('fail to create MultiProtocolGateway');
        } else {
          console.log('successfully create MultiProtocolGateway for %s', apiName);
        }
      });
    };
  });
}

// parse and validate the swagger file
SwaggerParser.validate('./'+ config.swaggerFileName, function(err, api) {
  if (err) {
    console.error(err);
  }
  else {

    /** CONSTANTS **/
    apiObj = api;
    apiHost = api.host;
    apiProtocol = api.schemes;
    if(config.mpgwConfig.name){apiName = config.mpgwConfig.name} else {apiName = api.info.title.replace(/\s/, "")};
    if(api.basePath){
      basePath = api.basePath;
    } else {
      basePath = '';
    };
    policyName = apiName + '_Policy'
    var apiPaths = Object.keys(api.paths);


    /** MAIN **/
    console.log("begin to build an MPGW service for API: %s", apiName);
    /*
      for each file path creats a proccesing rule and match object.
      if completed successfully, create a policy map object. push the object into an array
    */

    // array of mapped Rules
    var mappedRulesArray = [];
    apiPaths.forEach((path)=>{
      try {
        createPRules(path, (policyMap)=>{
          console.log('successfully create proccesing rules for: %s', path)
          mappedRulesArray = mappedRulesArray.concat(policyMap);
          /*
          when a pair of Proccessing rules successfully created for each api path,
          calls to create MultiProtocolGateway function which construct the service
          and his bounded objects
          */
          if (mappedRulesArray.length  == apiPaths.length * 2 ){
            createMpgw(mappedRulesArray)
          };
          });
      } catch (error) {
        console.log(error);
      };
    });
  }
});
