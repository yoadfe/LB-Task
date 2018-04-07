# Node LB
This is a basic HTTP Load Balancer built on Express.js

### The Load Balancer
- Based on Express.js as the server framework
- Get requests are being balanced with a round-robin method, using rocky proxy (https://github.com/h2non/rocky)
- Post requests are forwarded to All servers, returning reponse from first server contacted
- If one of the servers is unavailable during the post request, an infinite retries will be conducted, using an exponential back-off interval, using request-retry module and custom code (https://github.com/FGRibreau/node-request-retry)
- Metrics are exposed for Prometheus using prom-client (https://github.com/siimon/prom-client) and are available at /metrics endpoint

#### Prerequisites
- Node.js (This was developed and tested on version 8, so use that please :))
- Python 3 for the testing listener webserver

#### How to use?
- Clone the repo
- Set the config file located at config/default.json:
  - port: The port the load balancer should listen on
  - serversList: A backend servers array
  - postEndpoints - Endpoints for load balancer POST method, seperated by PIPE (See example inside the config file)
  - getEndpoints - Same as post endpoints, just for GET method

#### How to test?
Inside the Tester folder the is a simple python web server, run it with:

#### TODO
* Multiple Ports/Listeners
* Make app is more configurable from config file and not code
* Show nicer errors when reaching wrong endpoint (move debug to production)
* Implement some kind of multicast http in the forwarding method instead of sequencial loop (if possible)