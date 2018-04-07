// Set up express
let express = require('express');
// Set up express router
let router = express.Router();
// Set up the rocky proxy
let rocky = require('rocky');
let proxy = rocky();
// Set up request-rety module
let request = require('requestretry');
// Set up Prometheus client
let Prometheus = require('../util/prometheus');
//Get configuration for LB
let config = require('config');

//Global config section
let lbConfig = config.get('Global.LB');

//Get servers list from config
let serversList = lbConfig.get('serversList');


/**
 * Backoff Strategy
 * @param   {Number} attempts The number of times that the request has been attempted.
 * @return  {Number} number of milliseconds to wait before retrying again the request.
 */
function getExponentialBackoff(attempts) {
    return (Math.pow(2, attempts) * 100) + Math.floor(Math.random() * 50);
}

function exponentialBackoffStrategy() {
    let attempts = 0;
    return () => {
        attempts += 1;
        return getExponentialBackoff(attempts);
    };
}


//Start the counter functions
router.use(Prometheus.requestCounters);
router.use(Prometheus.responseCounters);
proxy.use(Prometheus.requestCounters);
proxy.use(Prometheus.responseCounters);

//enable metrics endpoint
Prometheus.injectMetricsRoute(router);
Prometheus.injectMetricsRoute(proxy);

//Enable collection of default metrics
Prometheus.startCollection();

//this sets rocky as a middleware so it will fetch the get req
router.use(proxy.middleware());

//get Endpoints from config
let postEndpoints = lbConfig.get('postEndpoints');
let getEndpoints = lbConfig.get('getEndpoints');

//round-robin balance get requests
proxy
    .get(`/:name(${getEndpoints})`)
    .balance(serversList)
    .use(function (req, res, next) {
        console.log(`GET Request from ${res.connection.remoteAddress}, Response code ${res.statusCode}`);
        next()
    });

//forward post requests
router.post(`/:name(${postEndpoints})`, function (req, res) {
    let responseSent = false;
    // Define proxy config params
    for (let i = 0, len = serversList.length; i < len; i++) {
        request.post({
                headers: req.headers,
                url: serversList[i],
                form: req.body,
                maxAttempts: Infinity,
                retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
                delayStrategy: exponentialBackoffStrategy()
            }, function (error, response, body) {
                if (error) {
                    console.log(error);
                }
                if (response) {
                    if (!responseSent) {
                        res.sendStatus(201);
                        responseSent = true;
                    }
                    console.log(`Post Request, Response code from ${serversList[i]}: ${response.statusCode}`);
                }
            }
        );
    }
});

module.exports = router;
