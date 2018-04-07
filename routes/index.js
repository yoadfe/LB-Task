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
const Prometheus = require('prom-client');
// Set up Config/Metrics
const metricsInterval = Prometheus.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'code'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
});


//Get configuration for LB
let config = require('config');
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

// Runs before each request
router.use((req, res, next) => {
    res.locals.startEpoch = Date.now();
    next()
});
proxy.use((req, res, next) => {
    res.locals.startEpoch = Date.now();
    next()
});

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

//expose metrics for Prometheus
router.get('/metrics', (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType);
    res.end(Prometheus.register.metrics())
});

// Runs after each request to collect metrics for the router endpoint
router.use((req, res, next) => {
    const responseTimeInMs = Date.now() - res.locals.startEpoch;
    httpRequestDurationMicroseconds
        .labels(req.method, req.route.path, res.statusCode)
        .observe(responseTimeInMs);
    next()
});
// Runs after each request to collect metrics for the rocky proxy endpoint
proxy.use((req, res, next) => {
    const responseTimeInMs = Date.now() - res.locals.startEpoch;
    httpRequestDurationMicroseconds
        .labels(req.method, res.statusCode)
        .observe(responseTimeInMs);
    next()
});

module.exports = router;
