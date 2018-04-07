# Node LB
This is a basic HTTP Load Balancer built on Express.js

### The Load Balancer
- Based on Express.js as the server framework
- Get requests are balanced with a round-robin method, using rocky proxy (https://github.com/h2non/rocky)
- Post requests are forwarded to All servers, returning response from first server available
- If one of the servers is unavailable during the post request, an infinite retries will be conducted, using an exponential back-off interval - with the help of request-retry module and custom code (https://github.com/FGRibreau/node-request-retry)
- Metrics are exposed for Prometheus using prom-client (https://github.com/siimon/prom-client) and are available at /metrics endpoint

#### Prerequisites
- Node.js (This was developed and tested on version 8, so use that please :))
- Python 3 for the testing the listener webserver

#### How to use?
- Clone the repo
- Set the config file located at config/default.json:
  - port: The port the load-balancer should listen on
  - serversList: A backend servers array (See example inside attached config file)
  - postEndpoints - Endpoints for load balancer POST method, seperated by PIPE (See example inside the config file)
  - getEndpoints - Same as post endpoints, just for GET method
- Eventually - Run with: npm start

#### How to test?
- Inside the Tester folder there is a simple python web server, you can use that or any other backend servers you'd like:
  - Cd into the Tester folder
  - Run with: python3 SimpleWebServer.py <port>
  - Run as many instances as you want to test(using different ports of course)
  - Those instances to be included in the serversList inside the config file
  - Use POSTMAN or any other utility/software to test the get/post requests to the LB
  - Check the node terminal & the web servers terminals to make sure requests were successful

#### TODO
- Multiple Ports/Listeners
- Make app is more configurable from config file and not code
- Show nicer errors when reaching wrong endpoint (move debug to production)
- Show spinner on retrying post
- Implement some kind of multicast http in the forwarding method instead of sequential loop (if possible)
- Make testing easier - One console with many ports, send all results to one console/log file
- Config validation
- Dockerize