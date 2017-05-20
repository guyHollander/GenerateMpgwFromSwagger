# GenerateMpgwFromSwagger

GenerateMpgwFromSwagger (GMFS) is a simple, node base tool, that create a basic DP's Multi protocol Gateway configuration exposing a remote REST service according to his Swagger file.

currently, the mpgw service that created to expose the remote REST service has the following configuration:

* a generic HTTP/HTTPS front side handler (listener).
* Processing policy contains a pair of processing rules for each Resource path on the remote REST service.


### Installation

GMFS is using Datapower's [Rest Managment Interface](https://www.ibm.com/support/knowledgecenter/en/SS9H2Y_7.5.0/com.ibm.dp.doc/restmgtinterface.html) to configurate the target machine and [Swagger-parser](https://github.com/BigstickCarpet/swagger-parser) Node js Model to Parse the swagger file. So, first of all, you'll have to install Node js on your local computer ([windows installation guide](http://blog.teamtreehouse.com/install-node-js-npm-windows), [linux installation guide](https://nodejs.org/en/download/package-manager/) ). then, you'll need to [enable the Rest Managment API](https://www.ibm.com/support/knowledgecenter/en/SS9H2Y_7.5.0/com.ibm.dp.doc/webgui_restinterface.html) on your datapower target machine.

After completeing those prerequisites, Clone the project folder into your local computer with git clone command or [download and extract the project folder](https://github.com/guyHollander/GenerateMpgwFromSwagger/archive/master.zip).

### Running The Tool

1. Copy the swagger file into the project directory.
2. Configure the tool. the configuration file, config.json, composed from swagger file property, and 2 Objects. Please make sure that the configuration is valid before running the tool!
```javascript
{
  "swaggerFileName":"Swagger file name",
  "restMngIntConfig":
    {
      "host": "Datapower Rest mng int listener address",
      "port":"Datapower Rest mng int listener address",
      "auth": "user:password"
    },
    "mpgwConfig": {
      "name":"mpgw name. if empty generate name from swagger file",
      "domain":"Datapower's domain where mpgw will be created",
      "localHost":"Datapower local machine addrees used by the service",
      "localPort":"Datapower local Port used by service",
      "sslFrontSideHandler": false for http Front side handler true for https,
      "sslObjectType":"if true choose type of ssl object - server, sni, proxy",
      "sslObjectName":"name of ssl object"
    }
}
```

4. From GMFS project folder run the following command:
```
node GenerateMpgwFromSwagger.js
```

5. If successfully created MPGW, be aware of:
* The order of the rules is the same as the order of paths in swagger file. some order changes might be necessary.
* Paths containing $ref definitions like int or string won't be resolved automatically  in this version.  you have to replace those manually in swagger file before you run the tool, or in DP matching rules afterwards with fitting regex expression .

6. If for some reason the tool failed to create MPGW, you'll have to remove manually any DP's object the tool has managed to create, or just use what already created and create the rest by yourself.
