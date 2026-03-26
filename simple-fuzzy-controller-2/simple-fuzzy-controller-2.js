/** 
 * Author: qp91mn64
 * Created: 2026-03-26
 * 
 * Restructure code in simple-fuzzy-controller.js which is for my tutorial simple-fuzzy-controller.md (in /docs folder).
 * You can try Zadeh or Mamdani method to calculate the fuzzy relation of each rule. 
 * Here the Mamdani method works better.
 * 
 * I ask DeepSeek how to restructure the code further, it recommends ES6 class, and a config parameter for flexibility.
 * I also try constructor function, but VSCode seems to recommend ES2015 class.
 * So I use a class for the source code.
 */
class FuzzyController {
    constructor(config) {
    this.inputU = config.inputU || [-1, 0, 1];
    this.outputU = config.outputU || [-1, 0, 1];
    this.membershipFunction = config.membershipFunction || [
        // 3 membership functions representating negative, zero, and positive
        function n(x, givenQuantity) {
            let membership;
            if (x <= givenQuantity - 200) {
                membership = 1;
            } else if (x > givenQuantity - 200 && x <= givenQuantity) {
                membership = (givenQuantity - x) / 200;
            } else {
                membership = 0;
            }
            return membership;
        },
        function z(x, givenQuantity) {
            let membership;
            if (x <= givenQuantity - 200) {
                membership = 0;
            } else if (x > givenQuantity - 200 && x <= givenQuantity) {
                membership = (x - givenQuantity + 200) / 200;
            } else if (x > givenQuantity && x <= givenQuantity + 200) {
                membership = (givenQuantity + 200 - x) / 200;
            } else {
                membership = 0;
            }
            return membership;
        },
        function p(x, givenQuantity) {
            let membership;
            if (x <= givenQuantity) {
                membership = 0;
            } else if (x > givenQuantity && x <= givenQuantity + 200) {
                membership = (x - givenQuantity) / 200;
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
    // Now "Zadeh" or "Mamdani" method is supported for calculating the fuzzy relation of each rule. 
    // Here the Mamdani method works better.
    this.method_FR = config.method_FR || "Mamdani"
    }
    control(input, givenQuantity) {
        /*
        Apply fuzzy control to the goal variable
        fuzzyInput: [(-1, n(-1)), (0, z(0)), (1, p(1))]
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
            results.push(this.applyOneFuzzyRule(fuzzyInput, this.fuzzyRules[i][0], this.fuzzyRules[i][1]));
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
    applyOneFuzzyRule(fuzzyInput, fuzzyIf, fuzzyThen) {
        let R = this.calculateFuzzyRelation(fuzzyIf, fuzzyThen);
        let result = this.fuzzyRelationSynthesis(fuzzyInput, R, fuzzyThen.length);
        return result;
    }
    calculateFuzzyRelation(fuzzyIf, fuzzyThen) {
        let R = [];
        for (let i = 0; i < fuzzyIf.length; i++) {
            for (let j = 0; j < fuzzyThen.length; j++) {
                if (this.method_FR == "Zadeh") {
                    R.push(Math.max(Math.min(fuzzyIf[i], fuzzyThen[j]), (1 - fuzzyIf[i])));  // Calculate the grade of membership
                } else {  // Mamdani method is default as it works better.
                    R.push(Math.min(fuzzyIf[i], fuzzyThen[j]));  // Calculate the grade of membership
                }
            }
        }
        return R;
    }
    fuzzyRelationSynthesis(fuzzyInput, R, R_width) {
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
