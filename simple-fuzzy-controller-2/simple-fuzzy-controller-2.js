/** 
 * Author: qp91mn64
 * Created: 2026-03-26
 * 
 * A simple fuzzy controller, with single input and single output, no dependencies.
 * Restructure code from simple-fuzzy-controller.js.
 * And the main usage now is for p5.js sketches, drawing graphics.
 * You can try Zadeh or Mamdani method to calculate the fuzzy relation of each rule. 
 * Here the Mamdani method works better.
 * 
 * Usage: 
 *   - Create a new FuzzyController:
 *     let fuzzyController = new FuzzyController(config);
 *   Where `config` is an object to pass in your own parameters other than the default
 *   an empty object {} is accepted with default values.
 *   
 *   - fastest way to apply the controller:
 *     let output = fuzzyController.control(input, givenQuantity);
 *   Where `givenQuantity` must be set manually.
 *   You can use the fuzzy controller to follow a value changing from time.
 *   
 *   - Main configurable parameters:
 *     - inputU: An array of the input universe
 *     - outputU: An array of the output universe, relating to how much the controller can output
 *     - fuzzyRules: A 3d array defining all fuzzy rules, each fuzzy rule consisting of a IF part and a THEN part
 *     - method_FR: The method used for calculating fuzzy relation of each rule, now support `Zadeh` or Mamdani` method
 * 
 * I ask DeepSeek how to restructure the code further, it recommends ES6 class, and a config parameter for flexibility.
 * I also try constructor function, but VSCode seems to recommend ES2015 class.
 * So I use a class for the source code.
 */
class FuzzyController {
    constructor(config) {
        // Input universe of discourse, each value is maximum point of corresponding membership function.
        this.inputU = config.inputU || [-200, 0, 200];
        // Output universe of discourse, represents negative, zero, positive, for defuzzification.
        this.outputU = config.outputU || [-1, 0, 1];
        /*
        3 membership functions respectively representing negative, zero, and positive, like this:
   
        mu    N      Z      P
        1 ------.    .    .------- 
                 \  / \  /
                  \/   \/ 
                  /\   /\
                 /  \ /  \
        0 ------.----.----.------- error = input - givenQuantity
                |    |    |
          inputU[0]  |  inputU[2]
                 inputU[1] (0 default)
        
        N (Negative): trapezoidal, with flat top from -inf to inputU[0]
        Z (Zero): triangular, the top point is inputU[1] (0 defalut)
        P (Positive): trapezoidal, with flat top from inputU[2] to inf

        Besides, for each value of error, the sum of all memberships equals 1.
        */
        this.membershipFunctions = config.membershipFunctions || [
            // DeepSeek suggests arrow functions for enabling these functions to use this.inputU.
            (x, givenQuantity) => {
                let membership;
                if (x <= givenQuantity + this.inputU[0]) {
                    membership = 1;
                } else if (x > givenQuantity + this.inputU[0] && x <= givenQuantity) {
                    membership = (givenQuantity - x) / (this.inputU[1] - this.inputU[0]);
                } else {
                    membership = 0;
                }
                return membership;
            },
            (x, givenQuantity) => {
                let membership;
                if (x <= givenQuantity + this.inputU[0]) {
                    membership = 0;
                } else if (x > givenQuantity + this.inputU[0] && x <= givenQuantity) {
                    membership = (x - givenQuantity - this.inputU[0]) / (this.inputU[1] - this.inputU[0]);
                } else if (x > givenQuantity && x <= givenQuantity + this.inputU[2]) {
                    membership = (givenQuantity + this.inputU[2] - x) / (this.inputU[2] - this.inputU[1]);
                } else {
                    membership = 0;
                }
                return membership;
            },
            (x, givenQuantity) => {
                let membership;
                if (x <= givenQuantity) {
                    membership = 0;
                } else if (x > givenQuantity && x <= givenQuantity + this.inputU[2]) {
                    membership = (x - givenQuantity) / (this.inputU[2] - this.inputU[1]);
                } else {
                    membership = 1;
                }
                return membership;
            }
        ],
        // Fuzzy rules
        // Each fuzzy rule contains two parts:
        // - IF part, an array of length 3, as 3 membership functions in total
        // - Then part, an array of length 3, same as the length of array outputU
        // Each value of both IF part and Then part is in the interval [0, 1].
        this.fuzzyRules = config.fuzzyRules || [
            [[1, 0.1, 0], [0, 0.1, 0.9]],  // IF negative, THEN increase the value
            [[0.1, 1, 0.1], [0.1, 0.9, 0.1]],  // IF zero, THEN remain the quantity unchanged
            [[0, 0.1, 1], [0.9, 0.1, 0]]  // IF positive, THEN decrease the value
        ],
        // Method calculating fuzzy relation of each rule.
        // Supported now: "Zadeh", "Mamdani", the latter works better.
        this.method_FR = config.method_FR || "Mamdani"
        // Calculate the fuzzy relations first.
        this.fuzzyRelations = [];
        this.calculateRs();
    }
    calculateRs() {
        for (let i = 0; i < this.fuzzyRules.length; i++) {
            let R = [];
            let fuzzyIf = this.fuzzyRules[i][0];
            let fuzzyThen = this.fuzzyRules[i][1];
            for (let j = 0; j < fuzzyIf.length; j++) {
                for (let k = 0; k < fuzzyThen.length; k++) {
                    if (this.method_FR == "Zadeh") {
                        R.push(Math.max(Math.min(fuzzyIf[j], fuzzyThen[k]), (1 - fuzzyIf[j])));  // Calculate the grade of membership
                    } else {  // Mamdani method is default as it works better.
                        R.push(Math.min(fuzzyIf[j], fuzzyThen[k]));  // Calculate the grade of membership
                    }
                }
            }
            this.fuzzyRelations.push(R);
        }
    }
    control(input, givenQuantity) {
        /*
        The fastest way to apply the fuzzy controller.
        Parameters
          - input: Number, which is outside of the controller.
          - givenQuantity: Number, used for the controller as a goal, must be set manually.
        Returns
          - output: Number
        */
        // First, fuzzify the input.
        let fuzzyInput = this.fuzzify(input, givenQuantity);
        // Second, apply all fuzzy rules available.
        let fuzzyOutput = this.applyFuzzyRules(fuzzyInput);
        // Third, defuzzify the fuzzy output.
        let output = this.defuzzify(fuzzyOutput);
        return output;
    }
    fuzzify(input, givenQuantity) {
        // Fuzzify the input by calculating the membership of the error to N, Z, P.
        let fuzzyInput = [];
        for (let i = 0; i < this.membershipFunctions.length; i++) {
            fuzzyInput.push(this.membershipFunctions[i](input, givenQuantity));
        }
        return fuzzyInput;
    }
    applyFuzzyRules(fuzzyInput) {
        // Apply all fuzzy rules available to calculate the fuzzy output.
        let results = [];
        for (let i = 0; i < this.fuzzyRules.length; i++) {
            results.push(this.applyOneFuzzyRule(fuzzyInput, i));
        }
        let result = [];
        // Calculate max value from each rule.
        for (let i = 0; i < results[0].length; i++) {
            let myMax = results[0][i];
            for (let j = 1; j < results.length; j++) {
                let a = results[j][i];
                if (a > myMax) {
                    myMax = a;
                }
            }
            result.push(myMax);
        }
        return result;
    }
    defuzzify(fuzzyResult) {
        // Defuzzify the fuzzy output using centroid method.
        // If each value of fuzzyResult is 0, 0 is returned.
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
                num += fuzzyResult[i] * this.outputU[i];
            }
            result = num / den;
        }
        return result;
    }
    applyOneFuzzyRule(fuzzyInput, fuzzyRuleIndex) {
        // Calculate output of one fuzzy rule with fuzzy relation synthesis.
        // Max-min composition is used.
        let R = this.fuzzyRelations[fuzzyRuleIndex];  // Use pre-calculated fuzzy relation
        let R_width = this.fuzzyRules[fuzzyRuleIndex][1].length;
        let result = [];
        for (let i = 0; i < R_width; i++) {
            let temp1 = [];
            for (let j = 0; j < fuzzyInput.length; j++) {
                temp1.push(Math.min(fuzzyInput[j], R[i + j * R_width]));  // min
            }
            result.push(this.arrayMax(temp1));  // max
        }
        return result;
    }
    arrayMax(a) {
        let m = a[0];
        for (let i = 1; i < a.length; i++) {
            if (a[i] > m) {
                m = a[i];
            }
        }
        return m;
    }
}
