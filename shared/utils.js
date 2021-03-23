/*
 *  Utils.js provides some shared utility functions which can be called from all of the different
 *      services. Primarily, this will serve many functions which can be used by the client-facing
 *      server, as it processes the individual blocks of the matrices.
 */

// Import dependencies
const math = require('mathjs');

// Function to split a (square) array in to quarters, returning an object containing the labelled corners
//      as A..D, clockwise from the top left corner of the matrix.
function splitArray(mat) {
    // Determine the size of the matrix from the array of the size's of the mathjs matrix
    mat_size = math.size(mat).valueOf()[0];

    // Using mathjs ranges and indexing, return the sub-matrices of the given matrix
    let a = math.subset(mat, math.index(math.range(0, mat_size/2), math.range(0, mat_size/2)));
    let b = math.subset(mat, math.index(math.range(0, mat_size/2), math.range(mat_size/2, mat_size)));
    let c = math.subset(mat, math.index(math.range(mat_size/2, mat_size), math.range(0, mat_size/2)));
    let d = math.subset(mat, math.index(math.range(mat_size/2, mat_size), math.range(mat_size/2, mat_size)));
    
    return {
        A: a,
        B: b,
        C: c,
        D: d
    }
}

module.exports = {
    splitArray: splitArray
}