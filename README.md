# ECS656U - Coursework
This program includes a gRPC client and server for performing matrix operations using a distributed system. The client is usable via a web-interface served by an Express client.


# Setting up, Overview & Running
In order to run the project, you need to install of the dependencies, which aren't tracked by the repo. To do this, simply run the command: `npm install` when inside the project folder, and they will automatically downloaded, assuming you already have Node.js installed. The result of the project is made up of 3 individual components:

<br>

## 1. Client
The client is defined as a REST interface, with an embedded gRPC client to handle the RPCs when we POST a request. The client can be ran by calling `node index.js` from within `./client`.

The resulting interface will run on port 3000, and can be accessed when running on your machine by navigating to `localhost:3000` in your browser.

The client also utilises Express.js and the Pug templating engine in order to produce the interface.

<br>

## 2. Client-Facing Server
The client-facing server is the direct handler for client RPCs, and it handles the shaping, splitting and forwarding of the matrices to the processing nodes. It is also responsible for making the final callback to the Client with the final result. All of this is done via async function calls, which allows multiple processing nodes to be ran in parallel.

The client-facing server can be ran with `node matrixServer.js` from within the `./server` directory. By default, this runs on port 1234, and in my tests, I have always ran this server locally.

This current implementation has no solution for automatically finding the addresses of the processing nodes, hence they must be manually provided in the `./server/nodeAddresses.json` file - but this server can dynamically scale to handle any number of available servers to scale operations.

<br>

## 3. Processing Nodes
Processing nodes are simply simple servers, which only implement naive functionality (so, no deadline for instance). These servers will simply recieve and RPC, and time themselves processing the given operation before returning the result via the callback. These are ran by using `node processingNode.js`.

By default, any processing node will run on a machine using port 1235. In my tests, these have been the cloud hosted servers (running on EC2 instances).

<br>

## Running
Running the project after this is set up is simple. If you navigate to the client interface at `localhost:3000`, you have the option to upload two json files containing json arrays denoting a 2d array. Any invalid formats (be it non-square matrices or otherwise) will be caught by the validation. 

If a deadline is specified, the server will make a best-effort using the footprint of the first block that is processed. In a worst case scenario where the deadline may not be met, the client-facing server will simply utilise as many servers as possible to do a best-effort at meeting the deadline. If instead no deadline is specified, the client-facing server will not footprint any blocks, and will simply process the multiplication as fast as possible, utilising as many servers as are available. 