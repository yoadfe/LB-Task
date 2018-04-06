# Node LB
This is a basic HTTP Load Balancer built on Express.js

### The Load Balancer
* Based on Express.js as the server framework
* Get requests are being balanced with a round-robin method, using rocky proxy (https://github.com/h2non/rocky)
* Post requests are forwarded to All servers, returning reponse from first server contacted
* If one of the servers is unavailable during the post request, an infinite retries will be conducted, using an exponential back-off interval, using request-retry module and custom code (https://github.com/FGRibreau/node-request-retry)
* Metrics are exposed for Prometheus using prom-client (https://github.com/siimon/prom-client) and are available at /metrics endpoint


#### How to use?
* Clone the repo

#### TODO
* Multiple Ports/Listeners
* Make app is more configurable from config file and not code
* Show nicer errors when reaching wrong endpoint (move debug to production)
