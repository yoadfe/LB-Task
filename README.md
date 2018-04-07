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
- Run with: npm start

#### How to test?
- Inside the Tester folder the is a simple python web server, you can use that or any other servers you'd like:
  - Cd into the Tester folder
  - Run with: python3 SimpleWebServer.py <port>
  - Run as many instances as you want (using different ports of course)
  - Those instances to be included in the serversList within the config file
  - Use postman or any other software to test get/post requests to the LB
  - Check the node terminal & the web servers terminals to make sure requests were successful

#### TODO
- Multiple Ports/Listeners
- Make app is more configurable from config file and not code
- Show nicer errors when reaching wrong endpoint (move debug to production)
- Implement some kind of multicast http in the forwarding method instead of sequential loop (if possible)
- Make testing easier - One console with many ports, send all results to one console/log file
