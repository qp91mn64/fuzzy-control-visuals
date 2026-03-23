/*
Author: qp91mn64
Created: 2026-03-23

Modified from fuzzy_1/script1.js in the same repository
*/
let x;
let v;
function setup() {
    createCanvas(600, 360);
    // Initialization
    x = random(600);
    v = 0;
}
function draw() {
    // Clear the canvas
    background(204);
    // First, fuzzify the location
    let f = membershipFunction(x);
    // Second, apply all the fuzzy rules
    let fuzzyVelocity = applyFuzzyRules(f);
    // Third, defuzzify fuzzyVelocity
    v = defuzzify(fuzzyVelocity);
    // Last, apply the new velocity
    x += v;
    // Display
    fill(map(v, -1, 1, 0, 255));
    circle(x, 100, 10);
    for (let x = 0; x < 600; x++) {
        let y = defuzzify(applyFuzzyRules(membershipFunction(x)));
        noStroke();
        fill(0);
        /*
        rect(x, height - map(y[0], 0, 1, 0, height-40), 3, 3);
        fill(100);
        rect(x, height - map(y[1], 0, 1, 0, height-40), 3, 3);
        fill(135);
        rect(x, height - map(y[2], 0, 1, 0, height-40), 3, 3);
        fill(170);
        rect(x, height - map(y[3], 0, 1, 0, height-40), 3, 3);
        fill(255);
        rect(x, height - map(y[4], 0, 1, 0, height-40), 3, 3);
        */
       rect(x, height - map(y, -2, 2, 0, height-40), 3, 3);
    }
}
function membershipFunction(x) {
    /*
    Calculate the membership function

    Parameters
        x: input scalar, here between 0 and 600, 
            and other number value is accepted.
    Returns 
        fuzzyLocation: a fuzzy set, [left2, left1, middle, right1, right2]
    */
    let fuzzyLocation;
    let left2, left1, middle, right1, right2;
    if (x <= 100) {
        left2 = 1;
    } else if (x > 100 && x <= 200) {
        left2 = map(x, 100, 200, 1, 0);
    } else {
        left2 = 0;
    }
    if (x <= 100) {
        left1 = 0;
    } else if (x > 100 && x <= 200) {
        left1 = map(x, 100, 200, 0, 1);
    } else if (x > 200 && x <= 300) {
        left1 = map(x, 200, 300, 1, 0);
    } else {
        left1 = 0;
    }
    if (x <= 200) {
        middle = 0;
    } else if (x > 200 && x <= 300) {
        middle = map(x, 200, 300, 0, 1);
    } else if (x > 300 && x <= 400) {
        middle = map(x, 300, 400, 1, 0);
    } else {
        middle = 0;
    }
    if (x <= 300) {
        right1 = 0;
    } else if (x > 300 && x <= 400) {
        right1 = map(x, 300, 400, 0, 1);
    } else if (x > 400 && x <= 500) {
        right1 = map(x, 400, 500, 1, 0);
    } else {
        right1 = 0;
    }
    if (x <= 400) {
        right2 = 0;
    } else if (x > 400 && x <= 500) {
        right2 = map(x, 400, 500, 0, 1);
    } else {
        right2 = 1;
    }
    fuzzyLocation = [left2, left1, middle, right1, right2];
    return fuzzyLocation;
}
function applyFuzzyRules(fuzzyLocation) {
    /*
    Rules：
    IF left, THEN right move
    IF middle, THEN stand still
    IF right, THEN left move
    
    left   = [1.0, 0.5, 0.1, 0.0, 0.0]
    middle = [0.0, 0.3, 1.0, 0.3, 0.0]
    right  = [0.0, 0.0, 0.1, 0.5, 1.0]
    
    right move:  velocity = [0.0, 0.0, 0.1, 0.4, 0.9]
    stand still: velocity = [0.0, 0.1, 0.9, 0.1, 0.0]
    left move:   velocity = [0.9, 0.4, 0.1, 0.0, 0.0]
    
    Calculating method for each membership of the result fuzzy set of A->B:
        Zadeh: max((1-mu_A(a)), min(mu_A(a), mu_B(b)))
        Mamdani(used here): min(mu_A(a), mu_B(b))
    Where mu_A(a) means the membership of the element a in fuzzy set A;
    a <-> rows, b <-> cols.

    Note that more than one fuzzy rule can be used at the same time
    In this case, the greatest value from all fuzzy rules is remained.
    
    Parameters
        fuzzyLocation: a fuzzy set, an array with 5 numbers
    Returns
        fuzzyVelocity: a fuzzy set, an array with 5 numbers
    I have no idea what if there is only one non-zero value in each fuzzy set of the THEN part.
    */
    // If left[2] and right[2] equals to a non-zero value
    // with other values remaining unchanged
    // Then there is a dead zone with zero velocity output
    // causing the circle to stop before reaching the center of the canvas.
    let left = [1.0, 0.5, 0.0, 0.0, 0.0];
    let middle = [0.0, 0.3, 1.0, 0.3, 0.0];
    let right = [0.0, 0.0, 0.0, 0.5, 1.0];
    let right_move = [0.0, 0.0, 0.1, 0.4, 0.9];
    let stand_still = [0.0, 0.1, 0.9, 0.1, 0.0];
    let left_move = [0.9, 0.4, 0.1, 0.0, 0.0];
    let temp = [];
    let R1 = [];
    let R2 = [];
    let R3 = [];
    let fuzzyVelocity = [];
    // Calculate the fuzzy matrix
    for (let i = 0; i < left.length; i++) {
        for (let j = 0; j < right_move.length; j++) {
            R1.push(Math.min(left[i], right_move[j]));
        }
    }
    for (let i = 0; i < middle.length; i++) {
        for (let j = 0; j < stand_still.length; j++) {
            R2.push(Math.min(middle[i], stand_still[j]));
        }
    }
    for (let i = 0; i < right.length; i++) {
        for (let j = 0; j < left_move.length; j++) {
            R3.push(Math.min(right[i], left_move[j]));
        }
    }
    // IF left, THEN right move
    for (let i = 0; i < right_move.length; i++) {
        let temp1 = [];
        for (let j = 0; j < fuzzyLocation.length; j++) {
            temp1.push(Math.min(fuzzyLocation[j], R1[i + j * left.length]));  // min
        }
        temp.push(max(temp1));  // max
    }
    fuzzyVelocity = temp.slice();
    // IF middle, THEN stand still
    temp = [];
    for (let i = 0; i < stand_still.length; i++) {
        let temp1 = [];
        for (let j = 0; j < fuzzyLocation.length; j++) {
            temp1.push(Math.min(fuzzyLocation[j], R2[i + j * middle.length]));  // min
        }
        let max_temp = max(temp1);
        temp.push(max(temp1));  // max
        if (fuzzyVelocity[i] < max_temp) { // max
            fuzzyVelocity[i] = max_temp;
        }
    }
    // IF right, THEN left move
    temp = [];
    for (let i = 0; i < left_move.length; i++) {
        let temp1 = [];
        for (let j = 0; j < fuzzyLocation.length; j++) {
            temp1.push(Math.min(fuzzyLocation[j], R3[i + j * right.length]));  // min
        }
        let max_temp = max(temp1);
        if (fuzzyVelocity[i] < max_temp) { // max
            fuzzyVelocity[i] = max_temp;
        }
    }
    return fuzzyVelocity;
}
function defuzzify(fuzzyVelocity) {
    /* 
    Defuzzify the fuzzy set velocity. Calculate the centroid.
    You may use a different method to defuzzify the fuzzy set.

    Parameters
        velocity: a fuzzy set, [left_move, stand_still, right_move]
    Returns
        Number
    If the denominator equals 0, 0 is returned.
    */
    let v1 = [-2, -1, 0, 1, 2];
    let den = fuzzyVelocity.reduce(function(a, b) {return a + b;});
    if (den == 0) {
        return 0;
    } else {
        let num = 0;
        for (let i = 0; i < fuzzyVelocity.length; i++) {
            num += fuzzyVelocity[i] * v1[i];
        }
        return num / den;
    }
}
