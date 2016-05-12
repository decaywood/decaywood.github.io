---
layout:     post
random-img: true
title:      函数式编程之高阶函数
subtitle:   higher-order function
date:       2016-05-11 20:51:27
author:      decaywood
description: 高阶函数，又称算子(运算符)或泛函
keywords: 高阶函数,闭包
tags:
    - 函数式编程
    - JavaScript
---

高阶函数，又称算子(运算符)或泛函。在数学和计算机科学中，高阶函数是至少满足下列一个条件的函数:

* 以一个或者多个函数作为参数
* 以一个函数作为返回结果

在程序语言中，高阶函数是一等公民（与普通变量一样，可存储，可传递）。以JavaScript语言为例，高阶函数的典型当属Array中的map、reduce以及filter函数了，所有这些函数遵循高阶函数的定义。然而，简单地展示几个用法不足以说明函数为参数的函数在函数式编程中的重要性。故本文会通过几个例子，穿插[闭包](/2016/04/02/Javascript-closure-intro/)内容对高阶函数的特性进行细致地讨论(不论是对函数式编程还是对一般的JavaScript编程，闭包都是一个重要的基础话题)。

## 例1：寻找合适的值

对于许多编程语言或者工具包，都包括一个名叫max的函数，旨在求解出数组或其他集合中的最大值（通常为一个数字）。max函数可能像下面这样执行：

```javascript
console.info(max([1, 2, 3, 4, 5])); // 5
console.info(max([1, 5, 8, 2.5, 9.6])) // 9.6
```

执行结果并没有什么特别的，但是这个特定的用例存在一个限制：比如此时你有一个用户列表，列表中存储了数个用户对象，用户包含了用户名、年龄等字段；而此时你想找出年龄最大的用户，这时max就不能复用了。然而工具包的开发者显然没有这么愚蠢，max是一个高阶函数，它允许传入第二个参数：用来获取待比较值的函数。例如：

```javascript
var users = [
    {name: "decaywood", age: 24}, 
    {name: "jack", age: 15}, 
    {name: "tom", age: 20}
];

var res = max(users, function (user) {
    return user.age;
});

console.info(res); // {name: "decaywood", age: 24}
```
可以看到，两参数版本的max更具有通用性。然而，它仍然具有局限性，并不是真正的函数式。具体来说，它仅仅是个能找出最大值的函数而已，它的比较过程总是依赖 ”\>“ 运算符。

此时，我们需要更通用、复用度更高的的新函数finder。它接收两个函数：一个用来获取待比较的值、另一个用来对两个值进行比较，返回相对更符合条件的值。finder实现如下所示：

```javascript
var users = [
    {name: "decaywood", age: 24},
    {name: "jack", age: 15},
    {name: "tom", age: 20}
];

function finder(collection, supplier, comparator) {
    return collection.reduce(function (best, cur) {
        var bestVal = supplier(best);
        var curVal = supplier(cur);
        return comparator(bestVal, curVal) ? best : cur;
    })
}

var res = finder(users, function (user) {
    return user.age;
}, function (best, cur) {
    return best > cur;
});

console.info(res); // {name: "decaywood", age: 24}
```

finder函数相较于max函数明显可以定制更多的功能了。

## 例2：迭代的艺术

让我们从一个repeat函数开始。它以一个数字和一个值为参数，将该值进行多次复制，并放入一个数组中：

```javascript
function range(times) {
    var arr = [];
    for (var i = 0; i < times; i++) arr.push(i);
    return arr;
}

function repeat(times, value) {
    return range(times).map(function () {
        return value;
    })
}

console.info(repeat(3, "decaywood")); // ["decaywood", "decaywood", "decaywood"]
```

repeat函数的实现使用map函数遍历从0到times-1的数组，并将value映射到数组中。然而，在这里存在一些局限性，value是一个固定值。与其重复一个值，或许重复一个运算更为科学，这将大大拓展这个函数的适用范围：

```javascript
function repeat(times, func) {
    return range(times).map(func)
}

var res = repeat(3, function (index) {
    return index * 2;
})；

console.info(res); // [0, 2, 4]
```

可以看到，repeat函数拓展性开展了许多，然而它还有改进的空间。比如可以引入迭代何时结束的判断，在开发中，迭代的结束往往不取决于次数而在于条件。换句话说，你可能需要不断调用一个函数，直到它的返回值超过了某个阈值。这样一来，前面两个版本的repeat函数就不适用了，下面为repeat函数进一步的改进：

```javascript
function repeat(next, check, init) {
    var arr = [];
    var n = next(init);
    for(;check(n);) {
        arr.push(n);
        n = next(n);
    }
    return arr;
}

var res = repeat(function (i) {
    if (i <= 1) return i + 1;
    return i * i;
}, function (i) {
    return i < 32;
}, 0);

console.info(res); // [1, 2, 4, 16]
```

改进版有三个参数：next函数控制迭代行为，check进行结果检查，init则提供初始值。循环体是一个前馈函数，换言之，next的执行结果被当做下一个函数的参数。

## 返回函数的高阶函数

创建一个以函数为返回值的函数的理由是，高阶函数的参数是用来“配置”返回函数的行为的。举个例子：定义一个高阶函数adderGen，它的参数配置了其返回函数加数的大小。

```javascript
function adderGen(x) {
    return function (num) {
        return x + num;
    }
}
var adder10 = adderGen(10);
var adder20 = adderGen(20);
console.info(adder10(5)); // 15
console.info(adder20(25)); // 45
```

可以看到，adderGen使用了闭包技术，返回的adder函数捕获了adderGen的参数x。

## 组合函数

**多态**

熟悉面向对象编程的朋友对重载肯定很熟悉了，简单来说就是同名函数根据不同的参数来产生不同的行为。要做到这一点，需要一种接收一个或多个函数然后不断尝试依次调用这些函数的方法，直到返回一个非undefined的值。这样的函数dispatch定义如下：

```javascript
function dispatch() {
    var funcs = Array.prototype.slice.call(arguments);
    var size = funcs.length;
    return function () {
        var res = undefined;
        var args = Array.prototype.slice.call(arguments);
        for (var index = 0; index < size; index++) {
            var func = funcs[index];
            res = func.apply(func, args);
            if (res) return res;
        }
        return res;
    }

}

var func = dispatch(function (a, b, c) {
    if (a && b && c) {
        console.info("func1");
        return true;
    }
}, function (a, b) {
    if (a && b) {
        console.info("func2");
        return true;
    }
});

func(1, 2, 3); // func1
func(1, 2); // func2
```

dispatch看似复杂，却满足了多态JavaScript函数的定义。这样做简化了委托具体方法的任务。不过这只是一个简陋的版本，真正健壮的dispatch函数还需要更多的参数检查机制。

**消除switch**

dispatch的另一种实用的模式可以对switch调度语句进行消除：

```javascript
function commandHardcoded(command) {
    var res = undefined;
    switch (command.type) {
        case "notify":
            res = ["notify: ", command.message].join("");
            break;
        case "join":
            res = ["join: ", command.message].join("");
            break;
        default:
            res = "exception";
    }
    return res;
}

console.info(commandHardcoded({type: "notify", message: "msg"})); // notify: msg
console.info(commandHardcoded({type: "join", message: "msg"})); // join: msg
console.info(commandHardcoded({type: "exception"})); // exception
```

改造：

```javascript
function isCommand(type, callback) {
    return function (command) {
        return command.type == type ? callback(command) : undefined;
    }
}

var commandImproved = dispatch(
    isCommand("notify", function (command) {
        return ["notify: ", command.message].join("");
    }),
    isCommand("join", function (command) {
        return ["join: ", command.message].join("");
    }),
    function (command) {
        return "exception";
    });

console.info(commandImproved({type: "notify", message: "msg"})); // notify: msg
console.info(commandImproved({type: "join", message: "msg"})); // join: msg
console.info(commandImproved({type: "exception"})); // exception
```

上述代码中的isCommand函数接受一个type字符串和一个callback函数，并返回一个新的函数。返回的函数会在type字符串和command.type相等时调用callback函数；否则返回undefined。返回的undefined会促使dispatch去尝试下一个函数。

此外commandImproved函数还可以进行进一步的拓展：

```javascript
var extension = dispatch(isCommand("kill", function (command) {
        return ["kill: ", command.message].join("");
    }), commandImproved);

console.info(extension({type: "notify", message: "msg"})); // notify: msg
console.info(extension({type: "join", message: "msg"})); // join: msg
console.info(extension({type: "kill", message: "msg"})); // kill: msg
console.info(extension({type: "exception"})); // exception
```

当然，在dispatch函数基础上还可以有很多创新的玩法，比如添加一些拦截器限制某些command的执行等，在此就不再赘述了。

## 小结

本文讨论了一些关于函数式编程的高阶函数方面的内容，函数式编程相对于面向对象编程来说，具有更少的状态，对并发编程更加友好，也更容易进行单元测试和维护。随着硬件性能的提高，相信函数式编程会变得越来越普及。