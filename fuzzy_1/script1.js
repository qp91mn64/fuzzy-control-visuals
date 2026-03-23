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
}
function membershipFunction(x) {
    /*
    left(x) =                  1, if x <= 100;
                map(x,100,300,1,0), if 100 <= x < 300;
                                0, if x > 300;
    middle(x) =                0, if x <= 100;
                map(x,100,300,0,1), if 100 <= x < 300;
                map(x,300,500,1,0), if 300 <= x < 500;
                                0, if x >= 500;
    right(x) =                 0, if x <= 300;
                map(x,300,500,0,1), if 300 <= x < 500;
                                1, if x >= 500;
    Parameters
        x: input scalar, here between 0 and 600, 
            and other number value is accepted.
    Returns 
        result: a fuzzy set, [left, middlt, right]
    */
    let result;
    let left, middle, right;
    if (x <= 100) {
        left = 1;
    } else if (x > 100 && x <= 300) {
        left = map(x, 100, 300, 1, 0);
    } else {
        left = 0;
    }
    if (x <= 100) {
        middle = 0;
    } else if (x > 100 && x <= 300) {
        middle = map(x, 100, 300, 0, 1);
    } else if (x > 300 && x <= 500) {
        middle = map(x, 300, 500, 1, 0);
    } else {
        middle = 0;
    }
    if (x <= 300) {
        right = 0;
    } else if (x > 300 && x <= 500) {
        right = map(x, 300, 500, 0, 1);
    } else {
        right = 1;
    }
    result = [left, middle, right];
    return result;
}
function applyFuzzyRules(location) {
    /*
    Rules：
    IF left, THEN right move
    IF middle, THEN stand still
    IF right, THEN left move
    
    velocity = [(-1, left_move), (0, stand_still), (1, right_move)]
    right move:  velocity = [0.0, 0.1, 0.9]
    stand still: velocity = [0.0, 0.9, 0.0]
    left move: velocity = [0.9, 0.1, 0.0]
    
    Calculating method:
        Zadeh: max((1-mu_A(a)), min(mu_A(a), mu_B(b)))
        Mamdani: min(mu_A(a), mu_B(b)) (used)
    Where mu_A(a) means the membership of the element a in fuzzy set A;
    a <-> rows, b <-> cols.

    Parameters
        location: a fuzzy set, [left, middle, right]
    Returns
        velocity: a fuzzy set, [left_move, stand_still, right_move]
    I have no idea if there is only one non-zero value in each fuzzy set of the THEN part.
    */
    let right_move = [0, 0.1, 0.9];
    let stand_still = [0, 0.9, 0];
    let left_move = [0.9, 0.1, 0];
    let r_move, s_still, l_move, velocity;
    // Input [1, 0, 0], then right move
    r_move = [Math.min(location[0], right_move[0]), Math.min(location[0], right_move[1]), Math.min(location[0], right_move[2])];
    // Input [0, 1, 0], then stand_still
    s_still = [Math.min(location[1], stand_still[0]), Math.min(location[1], stand_still[1]), Math.min(location[1], stand_still[2])];
    // Input [0, 0, 1], then left_move
    l_move = [Math.min(location[2], left_move[0]), Math.min(location[2], left_move[1]), Math.min(location[2], left_move[2])];
    // maximum of each output value with the same index from all the fuzzy rules
    velocity = [Math.max(r_move[0], s_still[0], l_move[0]), Math.max(r_move[1], s_still[1], l_move[1]), Math.max(r_move[2], s_still[2], l_move[2])];
    return velocity;
}
function defuzzify(velocity) {
    /* 
    Defuzzify the fuzzy set velocity. Calculate the centroid.
    You may use a different method to defuzzify the fuzzy set.

    Parameters
        velocity: a fuzzy set, [left_move, stand_still, right_move]
    Returns
        Number
    */
    let v1 = [-1, 0, 1];
    let den = velocity[0] + velocity[1] + velocity[2];
    if (den == 0) {
        return 0;
    } else {
        return (velocity[0] * v1[0] + velocity[1] * v1[1] + velocity[2] * v1[2]) / den;
    }
}
