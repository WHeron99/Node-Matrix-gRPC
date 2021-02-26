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

let client = new matrix_service.MatrixOperations('localhost:1234', grpc.credentials.createInsecure());

let mat1 = [[1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]];

let mat2 = [[2, 2, 2, 2],
        [3, 3, 3, 3],
        [4, 4, 4, 4],
        [5, 5, 5, 5]];

client.addMatrices({a: {values:mat1.flat(), size:mat1.length},
                    b: {values:mat2.flat(), size:mat2.length}}, 
                    (req, res) => {
                        console.log("Response Recieved!");
                        console.log(res.res);
                    });