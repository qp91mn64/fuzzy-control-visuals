/** 
 * Author: qp91mn64
 * Created: 2026-03-26
 * 
 * A simple fuzzy controller, with single input and single output, no dependencies.
 * Restructure code in simple-fuzzy-controller.js.
 * You can try Zadeh or Mamdani method to calculate the fuzzy relation of each rule. 
 * Here the Mamdani method works better.
 * 
 * Usage: 
 *   - Create a new FuzzyController:
 *     let fuzzyController = new FuzzyController(config);
 *   In which `config` is an object to pass in your own parameters other than the default
 *   an empty object {} is accepted with default values.
 *   
 *   - fastest way to apply the controller:
 *     let output = fuzzyController.control(input, givenQuantity);
 *   In which `givenQuantity` must be set manually.
 *   You can use the fuzzy controller to follow a value changing from time.
 *   
 *   - Configurable parameters:
 *     - inputU: An array of the domain of input
 *     - outputU: An array of the domain of fuzzy output, relating to how much the controller can output
 *     - membershipFunctions: an array with each valut a function calculating membership of input and givenQuantity
 *     - fuzzyRules: A 3d array defining all fuzzy rules, each fuzzy rule consisting of a IF part and a THEN part
 *     - method_FR: The method used for calculating fuzzy relation of each rule, now support `Zadeh` or Mamdani` method
 * 
 * I ask DeepSeek how to restructure the code further, it recommends ES6 class, and a config parameter for flexibility.
 * I also try constructor function, but VSCode seems to recommend ES2015 class.
 * So I use a class for the source code.
 */
class FuzzyController {
    constructor(config) {
        // Input universe of discourse, used by membership functions
        this.inputU = config.inputU || [-200, 0, 200];
        // Output universe of discourse, used by defuzzification
        this.outputU = config.outputU || [-1, 0, 1];
        this.membershipFunction = config.membershipFunction || [
            // 3 membership functions representating negative, zero, and positive
            // DeepSeek suggests arrow functions to enable these functions use this.inputU
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
        this.fuzzyRules = config.fuzzyRules || [
            [[1, 0.1, 0], [0, 0.1, 0.9]],  // IF negative, THEN increase the value
            [[0.1, 1, 0.1], [0.1, 0.9, 0.1]],  // IF zero, THEN remain the quantity unchanged
            [[0, 0.1, 1], [0.9, 0.1, 0]]  // IF positive, THEN decrease the value
        ],
        // Here the Mamdani method works better.
        this.method_FR = config.method_FR || "Mamdani"
        this.fuzzyRelations = [];
        // Calculate the fuzzy relations first
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
        // First, fuzzify the input
        let fuzzyInput = this.fuzzify(input, givenQuantity);
        // Second, apply all fuzzy rules available
        let fuzzyOutput = this.applyFuzzyRules(fuzzyInput);
        // Third, defuzzify the fuzzy output
        let output = this.defuzzify(fuzzyOutput);
        return output;
    }
    fuzzify(input, givenQuantity) {
        let fuzzyInput = [];
        for (let i = 0; i < this.membershipFunction.length; i++) {
            fuzzyInput.push(this.membershipFunction[i](input, givenQuantity));
        }
        return fuzzyInput;
    }
    applyFuzzyRules(fuzzyInput) {
        let results = [];
        for (let i = 0; i < this.fuzzyRules.length; i++) {
            results.push(this.applyOneFuzzyRule(fuzzyInput, i));
        }
        let result = [];
        // calculate max value of each element
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
        let R = this.fuzzyRelations[fuzzyRuleIndex];
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
