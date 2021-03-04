const PROTO_PATH = __dirname + '/../protos/matrixService.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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
                        success: true})
    }
}

function multiplyMatrices(call, callback) {
    console.log("Multiplying Matrices");

    // TODO : Handle distribution of process to other machines/servers via round-robin
    // TODO : Deadlining, Footprinting etc.

    // ! To complete
    callback(null, {});
}

// Start gRPC server to serve the requests
const server = new grpc.Server();

server.addService(matrix_service.MatrixOperations.service, {addMatrices: addMatrices, multiplyMatrices: multiplyMatrices});
server.bindAsync('0.0.0.0:1234', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server listening on port 1234`)
});