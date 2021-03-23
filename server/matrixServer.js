/*
 *  This file creates the client-facing server, which will directly service
 *      the client requests. In order to distribute the workload, this server will
 *      make further calls to distributed nodes which will execute parts of the process,
 *      such as multiplying two given blocks.
 *  Nodes will be selected via round-robin to service requests, from a list of known processing
 *      node addresses. 
 */

const PROTO_PATH = __dirname + '/../protos/matrixService.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const math = require('mathjs');
const fs = require('fs');

// Nominated import of the shared utility functions
const utils = require('../shared/utils');

let packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    }
);

let matrix_service = grpc.loadPackageDefinition(packageDefinition).matrixservice;

// Load the provided node addresses, and place in to a list
let raw_json = fs.readFileSync('nodeAddresses.json');
const addresses = JSON.parse(raw_json);
console.log("Loaded node addresses...");

// Map over the given addresses, and create a gRPC client for each
const node_clients = addresses.map(
    address => new matrix_service.MatrixOperations(
        address, 
        grpc.credentials.createInsecure()
    )
);

// We count the current number of remote calls, as to loop over all available processing 
//      nodes in a round-robin fashion
let iteration_count = 0;

// Shared function, which will process the multiplication on the given mode, and callback the result
function multiplyBlock(block_a, block_b, results, res_id, node_connection, callback) {
    // Get the (square) size of both blocks
    const block_size = math.size(block_a).valueOf()[0];
    node_connection.multiplyMatrices(
        {
            a: {values: block_a.valueOf().flat(), size: block_size},
            b: {values: block_b.valueOf().flat(), size: block_size}
        },
        (grpc_req, grpc_res) => {
            // RPC callback for processing node - get result then callback to the block-mult handler
            console.log("Multiply Response recieved, block: " + res_id);

            let mat_res = math.matrix(grpc_res.matrix.values);
            mat_res = math.reshape(mat_res, [grpc_res.matrix.size, -1]);
            console.log(mat_res);
            results[res_id] = mat_res;
            multiplyCallback(results, callback);
        }
    );
}

// Multiply a collection of blocks, utilising no footprint/scaling:
function multiplyBlocks(mat_a, mat_b, callback) {
    let results = {}
    
    // Multiply each block, with no blocking/waiting
    multiplyBlock(mat_a.A, mat_b.A, results, "AE", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.B, mat_b.C, results, "BG", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.A, mat_b.B, results, "AF", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.B, mat_b.D, results, "BH", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.C, mat_b.A, results, "CE", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.D, mat_b.C, results, "DG", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.C, mat_b.B, results, "CF", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
    multiplyBlock(mat_a.D, mat_b.D, results, "DH", node_clients[iteration_count % node_clients.length], callback)
    iteration_count += 1;
}

/*
function multiplyBlockDeadlined(mat_a, mat_b, deadline, callback) {

} */

function multiplyCallback(results, callback) {
    let results_count = Object.keys(results).length;

    if (results_count != 8) {
        return;
    }

    // If a set of 8 blocks have been fully gathered, add the result blocks, and callback the original request
    let block_a = math.add(results['AE'], results['BG']);
    let block_b = math.add(results['AF'], results['BH']);
    let block_c = math.add(results['CE'], results['DG']);
    let block_d = math.add(results['CF'], results['DH']);

    // Stack the results together
    block_a = math.concat(block_a, block_b);
    block_c = math.concat(block_c, block_d);
    let mat_res = math.concat(block_a, block_c, 0)

    // Get the size of the resulting matrix
    const res_size = math.size(mat_res).valueOf()[0];

    // Issue the callback
    callback(null, {matrix: {values: mat_res.valueOf().flat(), size: res_size},
                    success: true});
}

// * --- Following section implements the gRPC functionality for the client-facing server: --- *

// Handle a client request to simply add two matrices (Used primarily as a test for REST functionality)
function addMatrices(call, callback) {
    console.log('Adding Matrices!');
    if (call.request.a.size != call.request.b.size) {
        console.log('ARRAYS NOT EQUAL SIZE');
        callback(null, {res: {values: [], size: 0},
                        success: false, 
                        msg: "Invalid Sizes"})
    }
    else {
        // Map addition across respective elements of a and b - no reason to reshape
        let mat_a = call.request.a.values;
        let mat_b = call.request.b.values;
        let mat_res = mat_a.map((v, i) => {
            return v + mat_b[i];
        })
        callback(null, {matrix: {values: mat_res, size: call.request.a.size},
                        success: true});
    }
}

// Handle a client request to multiply two given matrices
function multiplyMatrices(call, callback) {
    console.log("Multiplying Matrices");

    let deadline = call.request.deadline;

    let mat_a = math.matrix(call.request.a.values);
    let mat_b = math.matrix(call.request.b.values);
    mat_a = math.reshape(mat_a, [call.request.a.size, -1]);
    mat_b = math.reshape(mat_b, [call.request.b.size, -1]);

    // Split each matrix in to 4 blocks each.
    mat_a = utils.splitArray(mat_a);
    mat_b = utils.splitArray(mat_b);

    // Multiply the collection of blocks together, utilising scaling
    multiplyBlocks(mat_a, mat_b, callback);

    // TODO: Provide option to use footprinting for scaling
}

// * Create the server, and begin listening for requests
const server = new grpc.Server();

server.addService(matrix_service.MatrixOperations.service, {addMatrices: addMatrices, multiplyMatrices: multiplyMatrices});
server.bindAsync('0.0.0.0:1234', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server listening on port 1234`);
});