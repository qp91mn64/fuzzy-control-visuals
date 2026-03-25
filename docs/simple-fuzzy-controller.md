# 模糊控制器怎么实现（极简版）

## 目录

- [模糊控制器的核心工作流程](#模糊控制器的核心工作流程)
- [把输入模糊化](#把输入模糊化)
  - [模糊集](#模糊集)
  - [怎么表示](#怎么表示)
  - [确定隶属函数](#确定隶属函数)
- [应用模糊规则](#应用模糊规则)
  - [运用一条模糊规则](#运用一条模糊规则)
    - [模糊关系](#模糊关系)
    - [模糊关系合成](#模糊关系合成)
  - [有多条规则怎么处理](#有多条规则怎么处理)
- [把结果变成确定值](#把结果变成确定值)
- [引入反馈](#引入反馈)
- [可视化部分](#可视化部分)
- [参考](#参考)

模糊控制是一种有实际应用的控制方法，原理看起来也不是太复杂，能不能自己写一个出来？为了降低难度，我们借助 JavaScript 实现模糊控制器的部分，[p5.js](https://p5js.org) 画图，控制画布上一个小圆的运动如何？JavaScript 的好处是，用浏览器就能运行，便于直接运行看效果；p5.js 的好处是，画图比较方便，结果直观。

模糊控制器可以有多个输入多个输出。我们的目的就是先把模糊控制器跑起来再说，后续慢慢扩展（比如二维情形，多个小圆，不同的输入输出量等，不同控制器的对比），为了进一步降低难度，从单输入单输出的开始。不过画布就是二维的，所以我们把小圆的运动限制在水平方向：

- 控制目标：让小圆到达中间之后就保持稳定，不往两边偏移。

- 输入量（一个）：小圆的位置坐标 `x`，范围 [0, 600]，采取默认的右边为正方向；

- 输出量（一个）：小圆的速度 `v`，范围 [-1, 1]，正值表示右移。

至于开发工具吗，VSCode 写代码 + 浏览器自带的开发者工具足够了。

## 模糊控制器的核心工作流程

大致是这么 4 步，其中前 3 步构成了整个模糊控制器（或者说，模糊推理系统），而最后一步实现了反馈调节：

1. 把输入模糊化

2. 应用模糊规则

3. 把结果变成确定值

4. 更新控制量，接收新的输入

## 把输入模糊化

把一个清晰的数值转化为一个**模糊集**。

### 模糊集

等一等，模糊集？什么东西？

一般集合，里面直接写属于这些集合的元素，对任意一个元素，要么属于这个集合，要么不属于这个集合，不存在其他情况。

模糊集，可以大致理解为一个元素可以“部分属于”这个集合，而且这个“部分属于”用**隶属度**来衡量。一个模糊集，里面每个元素，都有一个隶属度与之对应，而且**隶属度只能取 0 到 1 之间的数值**。特别地，0 相当于一般集合中的“不属于”，1 就相当于一般集合中的“属于”。

也就是说，模糊集看起来模糊，实际上还是清晰的、确定的，隶属度也不是什么神秘莫测的东西，就是个数值而已，只是这个数值能表示这个元素有多大程度上属于这个集合。

### 怎么表示

以这个模糊集 $\tilde{A}$ 为例（Zadeh 表示法）：

$\tilde{A}={\frac{0}{left}+\frac{0.1}{middle}+\frac{0.9}{right}}$

其中横线 `-` 底下的都是**元素**，一共三个：`left`、`middle`、`right`；横线上方的数字表示这个元素的**隶属度**。

进一步地，所有可能的元素组成的集合叫做**论域**，这里论域就是 $\left\{left, middle, right\right\}$。

这个模糊集的含义是什么呢？可以这样理解：元素 `left` 对这个模糊集 $\tilde{A}$ 的隶属度是 0，表明不属于 $\tilde{A}$ ；`middle` 的隶属度 0.1，表明不太像 $\tilde{A}$ 中的元素；`right` 的隶属度 0.9，表明很大程度上属于 $\tilde{A}$。于是 $\tilde{A}$ 相当于“接近右边的位置”。

使用 `left`、`middle`、`right` 这种词语是为了直观，你也可以用数字代替。

注意横线 `-` 不是除号，`+` 号也不表示相加；波浪线也不是必须的。

顺便补充几句，模糊集与普通集类似，也有**交集**、**并集**、**补集**等运算，其中交集的隶属度等于参与运算的每个模糊集合的对应元素隶属度的最小值（最小可能等于 0），并集则是取最大值（最大可能等于 1），而补集则是用 1 减去每个隶属度。

在编程语境下，只要你能区分，**拿一个数组表示隶属度**就够了，以 JavaScript 为例：

```JavaScript
let A = [0, 0.1, 0.9];
```

或者二维数组，如果你担心搞不清每个隶属度是谁的：

```JavaScript
let A = [["left", 0], ["middle", 0.1], ["right", 0.9]];
```

然后通过索引访问相应元素即可。你也可以用其他表示方法，只要能用。

### 确定隶属函数

隶属函数？什么东西？

说白了就是每个可能元素的隶属度，只是每个元素的“隶属度”都是确定的，能看作一个函数，而且取值也只能在 0 到 1 之间，包含两端。

要确定隶属度函数，首先要确定输入量的取值范围，以及分为几类。输入量就是 `x`，范围也已经确定好了，[0, 600]，那么分为几类呢？

简单一点，三类，左中右，分别用 `left`、`middle`、`right` 表示（也可以用数字 -1、0、1），看起来很粗略，不过勉强够了。

对 `x` 的每一个值，到三个类别都有一个隶属度，这样就能画出三个不同的隶属函数。

接下来就要确定具体的隶属函数表达式了。隶属函数说白了就是个值域在 [0, 1] 范围内的函数，只要你能表示一个普通函数就能表示一个隶属度函数。一般情况下，**三角形函数**，**梯形函数**（这两个都可以从图像上理解），**高斯函数**（钟形曲线）等就够用了。这种函数的共同特点是，中间的隶属度最高，往两边走，隶属度逐渐降低，走到两边就变成 0 了。

以 `left` 为例，从 0 开始的一片区域，都可以算作“左边”，然后逐渐往右走，就逐渐不像是“左边”了，直到走到快中间的时候，就不再是“左边”了，再往右走更不是“左边”了。于是 `x` 对于 `left` 的隶属度大致规律是，最开始的区域是 1，然后逐渐减小，接着快到中间 300 的位置就变成 0 了，再增大也是 0。

为了方便，这里采用梯形函数即可：

```JavaScript
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
```

那么到了中间怎么处理呢？交给 `middle`。恰好，一般意义上，300 这种正中间的值一定属于“中间”，而越往两边走，越不属于“中间”，而且两边的 `x` 值不属于中间。

这里用一个三角形函数就够了，而且关于画布对称：

```JavaScript
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
```

最后只剩下右边的了，考虑到“左”、“右”是对称的，与之前的定义的隶属度函数保持对称即可：

```JavaScript
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
```

在已知 `x` 值的情况下，找出三个隶属函数的对应取值，放在一起就能构成一个模糊集合，这个模糊集合就是变量 `x` 模糊化的结果：

```JavaScript
function fuzzify(x) {
    // Calculate the fuzzified location x
    let fuzzyLocation = [l(x), m(x), r(x)];  // Note: these function are defined before
    return fuzzyLocation;  // Returns a fuzzy set
}
```

比如说，当 `x` 取 240 的时候（随便哪个值都可以），分别代入上述 `l()`、`m()`、`r()`，在忽略精度的情况下，求出的结果是 `0.3`、`0.7`、`0`，也就是说，240 对 `left` 的隶属度是 0.3，对 `middle` 的隶属度是 0.7，对 `right` 的隶属度是 0。再代入 `fuzzify()`，得到 `[0.3, 0.7, 0]`，也就是预期得到的模糊集。

于是模糊化的部分：

```JavaScript
let x = 240;  // Choose a different value to see the output
// First, fuzzify the input
let fuzzyLocation = fuzzify(x);
```

把输入模糊化，听起来很神秘，**实际就是确定几个函数，然后分别取值的问题，只是每一个值都只能在 0 到 1 之间**。

## 应用模糊规则

输入已经转化为模糊集了，怎么根据这个模糊集判断呢？

用**模糊规则**。模糊规则是什么东西？

“**如果，那么**”形式的语句。

怎么定义呢？一般凭借实际经验。这里用直觉和常识就够了。我们的目标是让画布上的小圆往中间走，所以只要小球偏离中间就要往反方向走，到达中间就静止不动，于是由此确定 3 条模糊规则：

- 如果左边，就往右移动；
- 如果中间，就静止不动；
- 如果右边，就往左移动。

比如说，第一条规则，“如果左边，就往右移动”，其中“左边”，“往右移动”都是不确定的量，怎么衡量？

### 运用一条模糊规则

不是有模糊集吗？搬过来接着用不就好了吗，于是“左边”（位置），“往右移动”（速度）都用相应的模糊集表示了：

```JavaScript
let left = [1, 0.1, 0];
let right_move = [0, 0.1, 0.9];
```

类似地，另外两条规则的条件和结论：

```JavaScript
let middle = [0.1, 1, 0.1];
let stand_still = [0.1, 0.9, 0.1];
let right = [0, 0.1, 1];
let left_move = [0.9, 0.1, 0];
```

你也可以取其他的值。

这里可能有一点绕：位置的模糊集 3 个元素不是已经对应“左”“中”“右”了吗，怎么又冒出一个“左”“中”“右”？

主要是这里一共只有 3 类，规则偏偏也有 3 条，而且上文为了直观都用“左”“中”“右”命名，所以看起来就重复了，不过实际上还是有区别的：输入模糊化的时候用的“左”“中”“右”是三个**元素**；模糊规则里面的“左”“中”“右”则是**模糊集**，后续在计算模糊输出的时候用的是模糊集。把元素“左”“中”“右”换成 -1、0、1 三个数，就能区分开来。

两者之间的联系怎么体现呢？用**模糊关系**，一条规则对应一种模糊关系。严格来说是模糊蕴含关系，不过这里影响不大。

#### 模糊关系

还是模糊规则“如果左边，就往右移动”，还是刚才给出的模糊集 `left`，`right_move`，其模糊关系 `R` = `left -> right_move`，至少有这几种计算方式（代码形式）：

Zadeh 法：

```JavaScript
let left = [1, 0.1, 0];
let right_move = [0, 0.1, 0.9];
let R = [];
for (let i = 0; i < left.length; i++) {
    for (let j = 0; j < right_move.length; j++) {
        R.push(Math.max(Math.min(left[i], right_move[j]), (1 - left[i])));  // Calculate the grade of membership
    }
}
```

求出 `R` 等于 `[0, 0.1, 0.9, 0.9, 0.9, 0.9, 1, 1, 1]`。

Mamdani 法，也就是求最小值（交集）：

```JavaScript
let left = [1, 0.1, 0];
let right_move = [0, 0.1, 0.9];
let R = [];
for (let i = 0; i < left.length; i++) {
    for (let j = 0; j < right_move.length; j++) {
        R.push(Math.min(left[i], right_move[j]));  // Calculate the grade of membership
    }
}
```

求出 `R` 等于 `[0, 0.1, 0.9, 0, 0.1, 0.1, 0, 0, 0]`。

两者的区别在于 Zadeh 法在计算出最小值之后，还要与 `1 - A[i]`（$\tilde{A}$ 的补集） 计算最大值（并集），于是结果中的部分元素有可能比 Mamdani 法求出的更接近 1。

而结果是按照矩阵形式排列的，也叫**模糊矩阵**，尽管实际上是个模糊集，而且这里用的一维列表表示。

有了模糊关系，已知输入模糊集，看起来就能求出输出的模糊集了。怎么求呢？一般用**模糊关系合成**。

#### 模糊关系合成

假设输入模糊集是 $\tilde{C}$，模糊关系是 $\tilde{R}$，则其合成记作 $\tilde{C} \circ \tilde{R}$，而且合成得到的就是输出模糊集，这里记作 $\tilde{D}$。

怎么计算呢？

不难发现 $\tilde{C}$ 相当于只有一行的模糊矩阵，此外结果也相当于只有一行的模糊矩阵，比直接计算两个一般情形的模糊关系要简单一点。

一种计算方式是：$\tilde{D}$ 第 $i$ 个元素（隶属度），等于先取 $\tilde{C}$ 以及 $\tilde{R}$ 第 $i$ 列，求出这两个模糊集每组相同序号元素的*最小值*，再取这些最小值的*最大值*。

相应的代码实现：

```JavaScript
... // Suppose fuzzy set fuzzyLocation, left, right_move are known arrays, and R (left -> right_move) has been calculated ahead
let result = [];
for (let i = 0; i < right_move.length; i++) {
    let temp1 = [];
    for (let j = 0; j < fuzzyLocation.length; j++) {
        temp1.push(Math.min(fuzzyLocation[j], R[i + j * left.length]));  // min
    }
    result.push(arrayMax(temp1));  // max
}
```

注意：`arrayMax` 是自定义函数，作用是求数组里面的最大值：

```JavaScript
function arrayMax(a) {
    let m = a[0];
    for (let i = 1; i < a.length; i++) {
        if (a[i] > m) {
            m = a[i];
        }
    }
    return m;
}
```

不要直接用 `Math.max()` 求数组最大值，否则返回 `NaN`。此外如果你用了 p5.js，也可以用里面的 `max()` 函数，这个函数能直接求数组最大值。

这种计算方式对应的*算子*是“最小-最大”，或者叫做“Min-Max”；我不太清楚这种算子到底怎么表示，也不清楚到底有多少种，随便写的，也稍微查了一下（除了图书还有网上的资料）反正不止一种，也有用乘积（代数积）替代“最小值”的，用求和代替“最大值”的，等等，只是没有试过不知道效果。

你也可以多试几种不同的算子，反正运算次序是类似的。这里简便起见统一用“最小-最大”算子。

比如说，用之前求出来的 `[0.3, 0.7, 0]` 作为输入 `fuzzyLocation`，还是之前的 `left` 和 `right_move`， 使用 Zadeh 法求 `R`，接下来计算 `fuzzyLocation` 与模糊关系 `R` 的合成，先求最小值，再求最大值，求出 `result` 等于 `[0.7, 0.7, 0.7]`。

如果使用 Mamdani 法求的 `R`，求出的 `result` 就等于 `[0, 0.1, 0.3]`。

### 有多条规则怎么处理

也许你会认为只能用一条规则计算，但是这是谁规定的呢？就像模糊集合里面的元素不是要么属于要么不属于的，一条规则也不是要么用要么不用的，只要代入计算出来有非 0 元素就视为用到了这一条规则。

判断方式是：**只要有一个元素，规则的条件部分与输入里面的隶属度都大于 0，就用这条规则计算**。

还是刚才的模糊规则，再考虑剩下两条：

- 如果中间，就静止不动；
- 如果右边，就往左移动。

为了简便，把之前给出的计算模糊关系的代码整理一下，这样每次计算新的模糊规则就不用改变量名了：

```JavaScript
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
```

类似地，把输入与规则对应的模糊关系取合成的代码：

```JavaScript
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
```

那么之前的应用一条模糊规则的过程就是这样的，就两步：

```JavaScript
function applyOneFuzzyRule(fuzzyInput, fuzzyIf, fuzzyThen, method_R) {
    let R = calculateFuzzyRelationship(fuzzyIf, fuzzyThen, method_R);
    let result = fuzzyRelationSynthesis(fuzzyInput, R, fuzzyThen.length);
    return result;
}
```

对剩下两条规则，使用之前给出的条件和结论：

```JavaScript
let middle = [0.1, 1, 0.1];
let stand_still = [0.1, 0.9, 0.1];
let right = [0, 0.1, 1];
let left_move = [0.9, 0.1, 0];
```

输入还是 `[0.3, 0.7, 0]`，分别使用 Zadeh 法和 Mamdani 法求 `R`，得到剩下两条规则的输出，与之前的结果汇总如下：

| 模糊规则          | Zadeh         | Mamdani       |
|------------------|---------------|---------------|
|如果左边，就往右移动|[0.7, 0.7, 0.7]|[0, 0.1, 0.3]  |
|如果中间，就静止不动|[0.3, 0.7, 0.3]|[0.1, 0.7, 0.1]|
|如果右边，就往左移动|[0.7, 0.7, 0.7]|[0.1, 0.1, 0]  |

这么多输出，用哪一个呢？

常用**取并集**的思路，就是**每个元素的隶属度只保留各规则中求出的最大值**。

根据上表，显然，采用 Zadeh 法求 `R` 得到的是 [0.7, 0.7, 0.7]，采用 Mamdani 法求 `R` 得到的是 [0.1, 0.7, 0.3]。

用代码求一下，例如 Zadeh 法求 `R`，这里把求所有 3 个模糊规则输出的代码整理在一起：

```JavaScript
function applyFuzzyRules(fuzzyInput) {
    // Use variables suggested before
    let left = [1, 0.1, 0];
    let right_move = [0, 0.1, 0.9];
    let middle = [0.1, 1, 0.1];
    let stand_still = [0.1, 0.9, 0.1];
    let right = [0, 0.1, 1];
    let left_move = [0.9, 0.1, 0];
    let method = "Zadeh";  // You can try Mamdani method to calculate R
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
```

最后得到 `result` 的值是 `[0.7, 0.7, 0.7]`，与徒手计算的结果一致。

类似地，把 `let method = "Zadeh";` 改为 `let method = "Mamdani";`，只改一行代码，就能算出用 Mamdani 法求 `R` 对应的输出了，结果则是 `[0.1, 0.7, 0.3]`。

加上应用模糊规则的部分，现在的进度：

```JavaScript
let x = 240;  // Choose a different value to see the output
// First, fuzzify the input
let fuzzyLocation = fuzzify(x);
// Second, apply all fuzzy rules available
let fuzzyVelocity = applyFuzzyRules(fuzzyLocation);
```

于是给定输入，终于得到应用模糊规则得到的结果了。

## 把结果变成确定值

一般地，上述步骤得到的输出也是一个模糊集，而一般情况下确定的值才能用于实际输出，所以要把模糊集变成确定的值，也叫**解模糊化**。

方法也是不唯一的，这里采用重心法，就是每个隶属度对元素的具体值加权求和再除以隶属度之和：

```JavaScript
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
```

其中 `U` 表示速度模糊集的离散化的论域，只能取 -1，0，1 三个值。如果你嫌小球太慢了，可以取绝对值更大的数值，例如 -10，0，10。

分别对之前求出的两个结果解模糊化得到：

Zadeh 法：`0`

Mamdani 法：`0.18181818181818182`

由此发现，两种计算 `R` 的方法，得到的最终输出是有可能不同的。这个输出的含义就是画布上小圆的速度，于是 Zadeh 法求出的速度值 `0` 表示下一刻小球静止不动，最终误差也不能进一步减小了，而 Mamdani 法求出的速度值大于 0， 表示下一刻小球会往右移动，最终误差会更小。而最开始的输入 `x` 的值是 240，离中间还有一点距离，于是 Zadeh 法求 `R` 的控制器会导致左边的小球到不了最中间，如果要求比较高的话，这里还是用 Mamdani 法求 `R` 吧，最终误差也小，计算也比 Zadeh 法简单。

对于函数图形，就是求图形的重心，只是为了简化计算一般不用积分，都是求和。

加上解模糊的部分，现在的进度：

```JavaScript
let x = 240;  // Choose a different value to see the output
// First, fuzzify the input
let fuzzyLocation = fuzzify(x);
// Second, apply all fuzzy rules available
let fuzzyVelocity = applyFuzzyRules(fuzzyLocation);
// Third, defuzzify the fuzzy output
let v = defuzzify(fuzzyVelocity);
```

终于实现**模糊控制器**从输入到输出的全部核心部分了，或者一个完整的**模糊推理系统**了：

```JavaScript
function applyFuzzyControl(input) {
    // First, fuzzify the input
    let fuzzyInput = fuzzify(input);
    // Second, apply all fuzzy rules available
    let fuzzyOutput = applyFuzzyRules(fuzzyInput);
    // Third, defuzzify the fuzzy output
    let output = defuzzify(fuzzyOutput);
    return output;
}
```

于是我们的极简版模糊控制器：

```JavaScript
let x = 240;
let v = applyFuzzyControl(x);
```

## 引入反馈

对于一个模拟的小圆，在改变了速度之后，先更新小圆的位置 `x`：

```JavaScript
let dt = 1;  // Time interval for updating the location x; define this ahead
x += v * dt;  // update the location
```

目前进度：

```JavaScript
let x = 240;
let dt = 1;
let v = applyFuzzyControl(x);
// update the location
x += v * dt;
```

尽管没有物理实体，这个模糊控制器已经对位置 `x` 起到了控制作用，终于实现一个完整的单步控制过程了。下一步呢？

如果到此为止，不再检测新的 `x` 值，输出速度 `v` 保持不变，实际上只是个开环控制，这种控制方式虽然简单，但是小圆位置 `x` 达到预期的中间值之后不会自己停下来而是会直接越过，继续移动，然后南辕北辙。

怎么办呢？**引入反馈**，尤其是**负反馈**，实现**闭环控制**。

具体到我们实现的极简版模糊控制器，就是**更新之后的 `x` 作为新的输入**，最简单的方式是再代入上述过程计算一遍：

```JavaScript
let x = 240;
let dt = 1;
let v = applyFuzzyControl(x);
x += v * dt;
// Repeat once
v = applyFuzzyControl(x);
x += v * dt;
```

或者用循环来计算模糊控制器持续作用一段时间之后的输出：

```JavaScript
let x = 240;
let dt = 1;
let v;
console.log(`x 的初始值：${x}`);
for (let t = 0; t < 100; t += dt) {
    v = applyFuzzyControl(x);
    x += v * dt;
    console.log(`经过时间 ${t} 之后，x 的值：${x}`);
}
```

由此，完整的模糊控制已经实现，哪怕这个模糊控制器没有作用于任何物理实体。你也可以尝试其他编程语言，这里限于篇幅不再介绍。

## 可视化部分

**注意：这个部分需要 p5.js。**

控制对象就是一个圆，在画布上画个圆即可：

```JavaScript
function display() {
    circle(x, 100, 5);
}
```

进一步地，如果你想让小圆的颜色随着速度大小变化：

```JavaScript
function display() {
    fill((v + 1) * 127.5);
    circle(x, 100, 5);
}
```

借助 `draw()` 自带的循环，就不用再显式写循环了，而且也实现了反馈控制：

```JavaScript
function draw() {
    background(204);  // clear the canvas
    v = applyFuzzyControl(x);  // control
    x += v * dt;  // update the location
    display();  // visualization
}
```

注意每一帧先清空画布，用 `background(204);` 就够了。

接着是剩下的部分，包括初始值，以及对于画图而言最重要的，用 `createCanvas()` 创建一个画布，其中宽度 600：

```JavaScript
let x;
let v;
let dt;
function setup() {
    createCanvas(600, 360);  // width: 600
    x = 240;
    v = 0;
    dt = 1;
}
```

如果你想看不同初值的结果，可以用 `x = random(width);` 代替 `x = 240;`。

最后一步是把所有代码组装在一起运行看效果了。预期效果应该是，无论小球初始在哪里，都会往中间移动，接近中间的时候逐渐减速，最后基本上停留在画布正中间附近的位置。“麻雀虽小，五脏俱全”，哪怕控制的就是小圆的位置，看起来不起眼，也没有直接影响物理世界，一个模糊控制器该有的部分也都有了。

## 参考

[1] 程武山. 智能控制理论、方法与应用[M]. 北京:清华大学出版社,2009.  
[2] 刘杰,李允公,刘宇,等. 智能控制与MATLAB实用技术[M]. 北京:科学出版社,2017.  
[3] 罗兵,甘俊英,张建民. 智能控制技术[M]. 北京:清华大学出版社,2011.  
