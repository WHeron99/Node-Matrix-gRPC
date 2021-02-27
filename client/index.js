// Import grpc_client - which can be called on to do remote actions via the server
const grpc_client = require('./matrixClient');

const express = require('express');
const app = express();

// TODO: Set up app/express options here later

// Create routes for the application:
app.get('/', (req, res) => {
    console.log("Get request on index route:");
    res.send("Hello World!");
})

app.get('/test', (req, res) => {
    console.log("Test request!");
    let mat1 = [[1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]];

    let mat2 = [[2, 2, 2, 2],
            [3, 3, 3, 3],
            [4, 4, 4, 4],
            [5, 5, 5, 5]];

    grpc_client.addMatrices({a: {values:mat1.flat(), size:mat1.length},
                        b: {values:mat2.flat(), size:mat2.length}}, 
                        (grpc_req, grpc_res) => {
                            console.log("Response Recieved!");
                            console.log(grpc_res);
                            console.log(grpc_res.msg);
                            res.send(grpc_res.matrix.values);
                        });
})

// Set the express server to listen for requests on given port (default: 3000)
const PORT = process.env.EXPRESS_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Express listening on port: ${PORT}`);
})
