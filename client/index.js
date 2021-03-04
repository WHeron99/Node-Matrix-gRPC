// Import grpc_client - which can be called on to do remote actions via the server
const grpc_client = require('./matrixClient');

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const math = require('mathjs');
const path = require('path');

// Set up the view engine and template directory
app.set('view engine', 'pug');
app.set('views', './views');

app.use(fileUpload());
app.use(express.json());

// Create routes for the application:
app.get('/', (req, res) => {
    console.log("Get request on index route:");
    res.render('index');
})

app.post('/upload', (req, res) => {
    console.log("Getting uploaded files...");
    //let operation = req.body.operation;  //! Move later or directly access

    // Check for uploaded files, and ensure both are JSON files:
    if (!req.files || Object.keys(req.files).length <= 1) {
        return res.status(400).send('You must upload 2 files!');
    }

    let file_1 = req.files.file1;
    let file_2 = req.files.file2;

    if (path.extname(file_1.name) != ".json" || path.extname(file_2.name) != ".json") {
        return res.status(400).send("You must upload your matrices as .json files");
    }

    let mat_a = JSON.parse(file_1.data);
    let mat_b = JSON.parse(file_2.data);

    try {
        // Ensure that our matrices are valid (ie, all dimensions have the same number of elements)
        mat_a = math.matrix(mat_a);
        mat_b = math.matrix(mat_b);
        console.log(`${mat_a}\n${mat_b}`);
    } 
    catch (e) {
        console.log(e.message);
        return res.status(400).send("Failed to load matrices from file - check formatting and file type!");
    }

    // Finally, check that the matrices both have square, matching dimensions
    if (mat_a.size().length != 2 || mat_b.size().length != 2) {
        return res.status(400).send("Invalid number of dimensions in at least one of your uploaded matrices!");
    }
    if (! mat_a.size().every((val, index) => val === mat_b.size()[index])) {
        return res.status(400).send("Uploaded matrices differ in length in one or more dimensions!");
    }
    if (mat_a.size()[0] != mat_a.size()[1]) {
        return res.status(400).send("Matrices must be square for this calculator!");
    }
    // Matries must be same length and square now - ensure that that length is a power of 2.
    // Use bit manipulation approach on one value of the length:
    let len = mat_a.size()[0];
    if ( !(len && !(len & (len-1)) ) ) {
        return res.status(400).send("Your matrices must be square, with a length equal to a power of 2!");
    }

    // Matrices successfully checked for formatting errors - use RPC to process the chosen operation
    // Return matrices back to JS Array form:
    mat_a = mat_a.valueOf();
    mat_b = mat_b.valueOf();

    if (req.body.operation == 'addition') {
        grpc_client.addMatrices( 
            {
            a: {values: mat_a.flat(), size: len},
            b: {values: mat_b.flat(), size: len}
            },
            (grpc_req, grpc_res) => {
                console.log("Add Response recieved!");
                console.log(grpc_res);

                if (!grpc_res.success) {
                    // Remote operation failed, attempt to report on it
                    return res.status(500).send(`500: Server Error - ${grpc_res.msg}`);
                }

                // Get result from res, and reshape in to 2d
                let mat_res = math.matrix(grpc_res.matrix.values);
                mat_res = math.reshape(mat_res, [grpc_res.matrix.size, -1]);

                // Send result to client via as JSON Array
                res.header("Content-Type",'application/json');
                return res.json(mat_res.valueOf());
            }
        )
    }
    else if (req.body.operation == 'multiplication') {
        return res.send("Haven't implemented this yet!");
    }
    else {
        return res.status(400).send("Invalid operation selected!");
    }

})

// ? Test request route, performs remote addition on two matrices
app.post('/test', (req, res) => {
    console.log("Test request!");

    let mat1 = [[1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]];

    let mat2 = [[1, 1, 1, 1],
            [2, 2, 2, 2],
            [3, 3, 3, 3],
            [4, 4, 4, 4]];

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
