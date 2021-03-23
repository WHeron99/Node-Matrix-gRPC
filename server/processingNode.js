/*
 *  This file will create a gRPC server which will act purely as a processing
 *      node for the client-facing matrixServer. When the client-facing server
 *      wants to process multiplication in a distributed manner, it will execute
 *      RPCs on these nodes in order to distribute the processing
 *  These nodes will time their responses, such that they can inform the client-facing
 *      server of the expected processing time.
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

// Define the addition and multiplication services
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
        let mat_a = math.matrix(call.request.a.values);
        let mat_b = math.matrix(call.request.b.values);
        mat_a = math.reshape(mat_a, [call.request.a.size, -1]);
        mat_b = math.reshape(mat_b, [call.request.b.size, -1]);
        
        let mat_res = math.add(mat_a, mat_b);

        callback(null, {matrix: {values: mat_res.valueOf().flat(), size: call.request.a.size},
                    success: true});
    }
}

// For the processing node, we aren't interested in the deadline - we just want to multiply the two given matrices
//      and return the result asap.
function multiplyMatrices(call, callback) {
    console.log("Multiplying Matrices");

    let start_time = process.hrtime();

    let mat_a = math.matrix(call.request.a.values);
    let mat_b = math.matrix(call.request.b.values);
    mat_a = math.reshape(mat_a, [call.request.a.size, -1]);
    mat_b = math.reshape(mat_b, [call.request.b.size, -1]);

    mat_res =  math.multiply(mat_a, mat_b);

    let end_time = process.hrtime(start_time);
    let time_dif_ms = (end_time[0]* 1000000000 + end_time[1]) / 1000000;     // Convert in to ns, then back to ms

    callback(null, {matrix: {values: mat_res.valueOf().flat(), size: call.request.a.size},
                    success: true, processTime: time_dif_ms});
}

// Start gRPC server to serve the requests
const server = new grpc.Server();

server.addService(matrix_service.MatrixOperations.service, {addMatrices: addMatrices, multiplyMatrices: multiplyMatrices});
server.bindAsync('0.0.0.0:1235', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server listening on port 1235`)
});