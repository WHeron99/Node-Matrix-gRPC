/*
 *  Definition of gRPC client, to be embedded in the REST interface.
 */

// Given address should point to client-facing server, which will further delegate RPCs
const target_address = 'localhost:1234';

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
    target_address, 
    grpc.credentials.createInsecure()
);

module.exports = client;