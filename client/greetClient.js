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

let greeter_client = new greeting_service.GreetService('localhost:1234', grpc.credentials.createInsecure());

greeter_client.greetUser({name: 'Will'}, (req, res) => {
    console.log("Response Recieved: " + res.message);
})

greeter_client.greetWorld({name: "Will"}, (req, res) => {
    console.log("Response Recieved: " + res.message);
})