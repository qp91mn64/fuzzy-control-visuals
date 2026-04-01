/** 
 * Author: qp91mn64
 * License: MIT License
 * Created: 2026-03-30
 * 
 * Modified from simple-fuzzy-controller-2.js.
 * A simple fuzzy controller, with single input and single output, no dependencies.
 * Now supports unlimited linguistic variables for both input and output.
 * The main usage now is for p5.js sketches, drawing graphics.
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
 *     - inputU: An array of the input universe, consisting of at least 3 numbers, in ascending order
 *     - outputU: An array of the output universe, consisting of at least 3 numbers, in ascending order, relating to how much the controller can output
 *     - fuzzyRules: A 3d array defining all fuzzy rules, each fuzzy rule consisting of a IF part and a THEN part
 *     - method_FR: The method used for calculating fuzzy relation of each rule, now support `Zadeh` or `Mamdani` method, the latter works better.
 *     - defuzzificationMethod: The method used for defuzzification, now supports `centroid` (centroid method) or `max` (maximum membership method)
 * 
 * Zadeh's method seems to output zero unless the outputU is not symmetry...
 * I supposed the problem of my source code, but the formula was not mistaken.
 */
class FuzzyController {
    constructor(config) {
        // Input universe of discourse consisting of at least 3 numbers in ascending order, each value is maximum point of corresponding membership function.
        this.inputU = config.inputU || [-200, 0, 200];
        // Output universe of discourse, consisting of at least 3 numbers in ascending order, representing negative, zero, positive, for defuzzification.
        this.outputU = config.outputU || [-1, 0, 1];
        // Fuzzy rules
        // Each fuzzy rule contains two parts:
        // - IF part, an array of length same with inputU
        // - Then part, an array of length same with outputU
        // Each value of both IF part and Then part is in the interval [0, 1].
        this.fuzzyRules = config.fuzzyRules || [
            [[1, 0.1, 0], [0, 0.1, 0.9]],  // IF negative, THEN increase the value
            [[0.1, 1, 0.1], [0.1, 0.9, 0.1]],  // IF zero, THEN remain the quantity unchanged
            [[0, 0.1, 1], [0.9, 0.1, 0]]  // IF positive, THEN decrease the value
        ],
        // Method calculating fuzzy relation of each rule.
        // Supported now: "Zadeh" (max(min(IF[i], THEN[j]), (1 - IF[i]))), "Mamdani" (min(IF[i], THEN[j])), the latter works better.
        this.method_FR = config.method_FR || "Mamdani"
        // Supported method for defuzzification: "centroid" (calculate the centroid, default), or "max" (max membership)
        this.defuzzificationMethod = config.defuzzificationMethod || "centroid"
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
                        let a = Math.max(Math.min(fuzzyIf[j], fuzzyThen[k]), (1 - fuzzyIf[j]));
                        if (a != 0) {console.log(a);}
                        R.push(a);  // Calculate the grade of membership
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
        /*
        Fuzzify the input by calculating the membership of the error to each linguistic variable of inputU such as N, Z, P.

        If error (input - givenQuantity) equals to any element in inputU, then the same index of fuzzyInput will be set to 1.
        Otherwise, linear interpolaration is used, error is converted as a ratio between the nearest two values in inputU,
        and two elements of fuzzyInput is non-zero.
        Error beyond the input universe is clipped, no overflow.
        The sum of fuzzyInput is always 1.

        A typical set of membership function, 2m+1 in total,
        triangular for all the middle parts, trapezoidal for both sides, and clips if beyong the input universe:

        mu    Nm  Nm-1  Nm-2    N1   Z   P1    Pm-2  Pm-1  Pm
        1 ------.    .    . ... .    .    . ... .    .    .------
                 \  / \  /       \  / \  /       \  / \  /
                  \/   \/         \/   \/         \/   \/
                  /\   /\         /\   /\         /\   /\
                 /  \ /  \       /  \ /  \       /  \ /  \
        0 ------.----.----.-...-.----.----.-...-.----.----.---- error = input - givenQuantity
                |    |    |     |    |    |     |    |    |
              Ui[0]  |  Ui[2]   |  Ui[m]  | Ui[2m-1] | Ui[2m+1]
                   Ui[1]     Ui[m-1]   Ui[m+1]    Ui[2m]
        Where:
            Ui: inputU for simplicity, each defines the max point of a membership function,
                Ui[0] <-> Nm, Ui[1] <-> Nm-1, ..., Ui[m] <-> Z, ..., Ui[2m+1] <-> Pm.
            m: any positive integer, greater is more precise but calculates more.
            Nm, Nm-1, Nm-2, ... ,N1, Z, P1, ... ,Pm-2, Pm-1, Pm:
                2m+1 membership functions, meaning Negative most, Negative less most, ..., Negative smallest, Zero,
                Positive smallest, ..., Positive less most, Positive most, respectively,
        If the length of Ui is even (2m), then the middle-most two represents NZ (Negative Zero) and PZ (Positive Zero) respectively.
        */
        let fuzzyInput = [];
        let n = this.inputU.length;
        let error = input - givenQuantity;
        for (let i = 0; i < n; i++) {
            fuzzyInput.push(0);
        }
        // Clip the error if beyond the input universe.
        if (error < this.inputU[0]) {
            fuzzyInput[0] = 1;
            return fuzzyInput;
        } else if (error > this.inputU[n - 1]) {
            fuzzyInput[n - 1] = 1;
            return fuzzyInput;
        } else {
            // linear interpolaration
            for (let i = 0; i < n; i++) {
                let x1 = this.inputU[i];
                let x2 = this.inputU[i + 1];
                if (error == x1) {
                    fuzzyInput[i] = 1;
                    break;
                }
                if (error < x2) {
                    let ratio = (x2 - error) / (x2 - x1);
                    fuzzyInput[i] = ratio;
                    fuzzyInput[i + 1] = 1 - ratio;
                    break;
                }
            }
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
        /*
        Defuzzify the fuzzy output using centroid method.
        If each value of fuzzyResult is 0, 0 is returned.
        Methods supported:
        - "centroid": Default, calculate the centroid of fuzzyResult.
        - "max": Maximum membership method, cauculate maximum membership of linguistic variables in outputU.
                 If there are two or more, return average of them.
        */
        let result;
        if (this.defuzzificationMethod == "max") {
            result = 0;
            let a = 0;
            let whichNumber = 0;
            let maxPoints = [];
            for (let i = 0; i < fuzzyResult.length; i++) {
                if (fuzzyResult[i] > a) {
                    a = fuzzyResult[i];
                    whichNumber = i;
                }
            }
            for (let i = whichNumber; i < fuzzyResult.length; i++) {
                if (Math.abs(fuzzyResult[i] - a) < 1e-8) {
                    maxPoints.push(this.outputU[i]);
                }
            }
            for (let i = 0; i < maxPoints.length; i++) {
                result += maxPoints[i];
            }
            result = result / maxPoints.length;
        } else {
            let num = 0;
            let den = 0;
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
