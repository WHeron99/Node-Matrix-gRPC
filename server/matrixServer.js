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
    if (call.request.a.square_size != call.request.b.square_size) {
        console.log('ARRAYS NOT EQUAL SIZE');
        callback(null, {res: {values: [], square_size: 0}, 
                        msg: "Invalid Sizes"})
    }
    else {
        let mat_a = call.request.a.values;
        let mat_b = call.request.b.values;
        let mat_res = mat_a.map((v, i) => {
            return v + mat_b[i];
        })
        callback(null, {res: {values: mat_res, square_size: call.request.a.square_size},
                        msg: "Success"})
    }
}

// Start gRPC server to serve the requests
const server = new grpc.Server();

server.addService(matrix_service.MatrixOperations.service, {addMatrices: addMatrices});
server.bindAsync('0.0.0.0:1234', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});