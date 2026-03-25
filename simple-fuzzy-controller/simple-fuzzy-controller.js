/** 
 * Author: qp91mn64
 * Created: 2026-03-26
 * 
 * Source code of the fuzzy controller for my tutorial simple-fuzzy-controller.md (in /docs folder)
 */
function applyFuzzyControl(input) {
    // First, fuzzify the input
    let fuzzyInput = fuzzify(input);
    // Second, apply all fuzzy rules available
    let fuzzyOutput = applyFuzzyRules(fuzzyInput);
    // Third, defuzzify the fuzzy output
    let output = defuzzify(fuzzyOutput);
    return output;
}
function fuzzify(x) {
    // Calculate the fuzzified location x
    let fuzzyLocation = [l(x), m(x), r(x)];  // Note: these function are defined before
    return fuzzyLocation;  // Returns a fuzzy set
}
function applyFuzzyRules(fuzzyInput) {
    // Use variables suggested before
    let left = [1, 0.1, 0];
    let right_move = [0, 0.1, 0.9];
    let middle = [0.1, 1, 0.1];
    let stand_still = [0.1, 0.9, 0.1];
    let right = [0, 0.1, 1];
    let left_move = [0.9, 0.1, 0];
    let method = "Mamdani";  // You can try Mamdani method to calculate R
    let result1 = applyOneFuzzyRule(fuzzyInput, left, right_move, method);
    let result2 = applyOneFuzzyRule(fuzzyInput, middle, stand_still, method);
    let result3 = applyOneFuzzyRule(fuzzyInput, right, left_move, method);
    let result = result1.slice();  // Copy the array result1
    for (let i = 0; i < result.length; i++) {
        if (result2[i] > result[i]) {
            result[i] = result2[i];
        }
        if (result3[i] > result[i]) {
            result[i] = result3[i];
        }
    }
    return result;
}
function defuzzify(fuzzyResult) {
    let U = [-1, 0, 1];  // use greater values if the ciecle moves too slowly
    let num = 0;
    let den = 0;
    let result;
    for (let i = 0; i < fuzzyResult.length; i++) {
        den += fuzzyResult[i];
    }
    if (den == 0) {  // The denominator cannot be zero
        return 0;
    } else {
        for (let i = 0; i < fuzzyResult.length; i++) {
            num += fuzzyResult[i] * U[i];
        }
        result = num / den;
    }
    return result;
}
function l(x) {
    // Calculate the grade of membership between x and left
    let membership;
    if (x <= 100) {
        membership = 1;
    } else if (x > 100 && x <= 300) {
        membership = (300 - x) / 200;
    } else {
        membership = 0;
    }
    return membership;
}
function m(x) {
    // Calculate the grade of membership between x and middle
    let membership;
    if (x <= 100) {
        membership = 0;
    } else if (x > 100 && x <= 300) {
        membership = (x - 100) / 200;
    } else if (x > 300 && x <= 500) {
        membership = (500 - x) / 200;
    } else {
        membership = 0;
    }
    return membership;
}
function r(x) {
    // Calculate the grade of membership between x and right
    let membership;
    if (x <= 300) {
        membership = 0;
    } else if (x > 300 && x <= 500) {
        membership = (x - 300) / 200;
    } else {
        membership = 1;
    }
    return membership;
}
function applyOneFuzzyRule(fuzzyInput, fuzzyIf, fuzzyThen, method_R) {
    let R = calculateFuzzyRelationship(fuzzyIf, fuzzyThen, method_R);
    let result = fuzzyRelationSynthesis(fuzzyInput, R, fuzzyThen.length);
    return result;
}
function calculateFuzzyRelationship(fuzzyIf, fuzzyThen, method) {
    let R = [];
    for (let i = 0; i < fuzzyIf.length; i++) {
        for (let j = 0; j < fuzzyThen.length; j++) {
            if (method == "Zadeh") {
                R.push(Math.max(Math.min(fuzzyIf[i], fuzzyThen[j]), (1 - fuzzyIf[i])));  // Calculate the grade of membership
            } else {  // Mamdani method is default; the steady-state error can be smaller here
                R.push(Math.min(fuzzyIf[i], fuzzyThen[j]));  // Calculate the grade of membership
            }
        }
    }
    return R;
}
function fuzzyRelationSynthesis(fuzzyInput, R, R_width) {
    let result = [];
    for (let i = 0; i < R_width; i++) {
        let temp1 = [];
        for (let j = 0; j < fuzzyInput.length; j++) {
            temp1.push(Math.min(fuzzyInput[j], R[i + j *  R_width]));  // min
        }
        result.push(arrayMax(temp1));  // max
    }
    return result;
}
function arrayMax(a) {
    let m = a[0];
    for (let i = 1; i < a.length; i++) {
        if (a[i] > m) {
            m = a[i];
        }
    }
    return m;
}