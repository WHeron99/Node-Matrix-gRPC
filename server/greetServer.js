const PROTO_PATH = __dirname + '/../protos/greetService.proto';
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

let greeting_service = grpc.loadPackageDefinition(packageDefinition).greetservice;

// Implement gRPC / proto defined functions:
function greetUser(call, callback) {
    console.log("Greet User Request...");
    callback(null, {message: 'Hello ' + call.request.name});
}

function greetWorld (call, callback) {
    console.log("Greet World Request...");
    callback(null, {message: 'Hello World!'});
}

// Start gRPC server to serve the requests
const server = new grpc.Server();

server.addService(greeting_service.GreetService.service, {greetUser: greetUser, greetWorld: greetWorld});
server.bindAsync('0.0.0.0:1234', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});