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

const matrix_service = grpc.loadPackageDefinition(packageDefinition).matrixservice;

const client = new matrix_service.MatrixOperations(
    'localhost:1234', 
    grpc.credentials.createInsecure()
);

module.exports = client;