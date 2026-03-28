# Fuzzy Control With Visuals

This is my playground for fuzzy control used in p5.js sketches. Maybe the structure is a little messy.

## Why start this

Since the creation of fuzzy set theory by Zadeh in 1965, fuzzy logic control (or say fuzzy control for simplicity) has made much progess and has been widely used. For instance, you can find fuzzy controllers in furnitures on the market.

The principles of a fuzzy controller is not too complex, so it is possible to write one to see what it is in just a few days.

And the question: What if fuzzy control is introduced in p5.js sketches? Can it be used to draw fantastic, dynamic graphics?

## What can you find now

```
fuzzy-control-visuals/
  ├── docs/
  │    └── simple-fuzzy-controller.md        # a simple tutorial on fuzzy control
  ├── simple-fuzzy-controller/             # complete source code of my tutorial
  │    ├── index-no-p5js.html
  │    ├── index-with-p5js.html
  │    └── simple-fuzzy-controller.js        # implementation of fuzzy controller
  ├── simple-fuzzy-controller-2/
  │    ├── index-no-p5js-2.html              # testing
  │    ├── index-with-p5js-2.html            # sketches with p5.js to draw graphics
  │    ├── index-with-p5js-2a.html
  │    ├── index-with-p5js-2b.html
  │    ├── fuzzy-follower-with-p5js.html
  │    ├── fuzzy-follower-with-p5js-2.html
  │    └── simple-fuzzy-controller-2.js      # implementation of fuzzy controller
  ├── fuzzy_1/                             # an experimental sketch
  │    ├── index.html
  │    └── script1.js
  ├── fuzzy_2/                             # also an experimental sketch
  │    ├── index.html
  │    └── script1.js
  ├── LICENSE
  └── README.md
```

## Quick start

Choose a HTML file with the name including `with-p5js` and open with your browser on the computer to see visuals.

Or see `simple-fuzzy-controller.md` if you are unfamiliar with fuzzy control.

Math or technical details is not cared about too much.

## If you want to use the fuzzy controller

Now the `simple-fuzzy-controller-2.js` is recommended as it is easier to configure.

You can directly "import" a JS file as simple as adding a line into your HTML file, for example, `simple-fuzzy-controller-2.js`, as long as you put all the files into the same folder:

```HTML
<script src="simple-fuzzy-controller-2.js"></script>
```

Then you can call the methods provided from this file, for example:

```JavaScript
let input = ...;
let given = ...;
let config = {method_FR: "Mamdani"};  // Use minimum to calculate fuzzy relations of each rule
let fuzzyController = new FuzzyController(config);
let output = fuzzyController.control(input, given);
```

or

```JavaScript
let error = ...;  // input - given
let config = {method_FR: "Mamdani"};  // Use minimum to calculate fuzzy relations of each rule
let fuzzyController = new FuzzyController(config);
let output = fuzzyController.control(error, 0);
```

Where:
- `config` is a simple JS object to pass in your own parameters for controlling, so that you can implement your own controller in without changing the source code. `{}` means use all parameters as default. Main parameters supported:
  - method_FR: `Zadeh` (`max(min(IF[i], THEN[j]), (1 - IF[i]))`) or `Mamdani` (`min(IF[i], THEN[j])`), the latter is default.
  - fuzzyRules: a 3d array, with each value a fuzzy rule. The first part of a fuzzy rule means IF and second part means THEN, with each part containing 3 values between 0 and 1. An example of a fuzzy rule is `[[1, 0.1, 0], [0, 0.1, 0.9]]`.
  - inputU: An array representing linguistic negative, zero, positive respcetively for input. Now `[-200, 0, 200]` is default.
  - outputU: An array representing linguistic negative, zero, positive respcetively for output. `[-1, 0, 1]` is default.
- `given` can be set to what you like, even `mouseX` or location of a moving object works, as long as it is a `Number` in JS; too great or low values are treated the same as boundaries.
- `output` is an amount calculated by the controller to make the `input` follow `given` or `error` follow 0 a bit nearer.

For more details please read the source code.

## Some thoughts

When it comes to dynamic graphics, how the nature of these themes is relative to control?

What is the relationship between complex systems and visual art?

## License

The MIT License. See [LICENSE](LICENSE).
