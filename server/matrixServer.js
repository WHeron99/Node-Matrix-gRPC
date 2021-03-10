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

function multiplyMatrices(call, callback) {
    console.log("Multiplying Matrices");

    let deadline = call.request.deadline;

    let mat_a = math.matrix(call.request.a.values);
    let mat_b = math.matrix(call.request.b.values);
    mat_a = math.reshape(mat_a, [call.request.a.size, -1]);
    mat_b = math.reshape(mat_b, [call.request.b.size, -1]);

    // PLACEHOLDER - DO MULTIPLICATION WITH BLOCK DIVISION
    mat_res =  math.multiply(mat_a, mat_b);

    // TODO : Handle distribution of process to other machines/servers via round-robin
    // TODO : Deadlining, Footprinting etc.

    callback(null, {matrix: {values: mat_res.valueOf().flat(), size: call.request.a.size},
                    success: true});
}

// Start gRPC server to serve the requests
const server = new grpc.Server();

server.addService(matrix_service.MatrixOperations.service, {addMatrices: addMatrices, multiplyMatrices: multiplyMatrices});
server.bindAsync('0.0.0.0:1234', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server listening on port 1234`)
});