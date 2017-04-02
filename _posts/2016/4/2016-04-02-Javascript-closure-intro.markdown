---
layout:     post
random-img: true
title:      关于JavaScript的闭包
subtitle:   About closure of JavaScript
date:       2016-04-02 12:44:31
author:     decaywood
description: 闭包是ECMAScript（JavaScript）最强大的特性之一，但用好闭包的前提是必须理解闭包。闭包的创建相对容易，人们甚至会在不经意间创建闭包，但这些无意创建的闭包却存在潜在的危害，尤其是在比较常见的浏览器环境下。
keywords: JavaScript,Java,Python,closure,闭包
tags:
    - JavaScript
---

闭包是ECMAScript（JavaScript）最强大的特性之一，但用好闭包的前提是必须理解闭包。闭包的创建相对容易，人们甚至会在不经意间创建闭包，但这些无意创建的闭包却存在潜在的危害，尤其是在比较常见的浏览器环境下。如果想要扬长避短地使用闭包这一特性，则必须了解它们的工作机制。而闭包工作机制的实现很大程度上有赖于标识符（或者说对象属性）解析过程中作用域的角色。

## 变量的作用域

要理解闭包，首先必须理解JavaScript特殊的变量作用域。变量的作用域无非就是两种：全局变量和局部变量。JavaScript语言的特殊之处，就在于函数内部可以直接读取全局变量。

```javascript
var author = "decaywood";
function func() {
    console.info(author);
}
func(); // decaywood
```
另一方面，在函数外部自然无法读取函数内的局部变量。

```javascript
function func() {
    var author = "decaywood";
}
console.info(author); // undefined
```

这里有一个地方需要注意，函数内部声明变量的时候，一定要使用var命令，如果不用的话，你实际上声明了一个全局变量。

```javascript
function func() {
    author = "decaywood";
}
func();
console.info(author) // decaywood
```

## 如何从外部读取局部变量？

出于种种原因，我们有时候需要得到函数内的局部变量。但是，前面已经说过了，正常情况下，这是办不到的，只有通过变通方法才能实现。那就是在函数的内部，再定义一个函数。

```javascript
function outerFunc() {
    var name = "decaywood";
    function innerFunc() {
        console.info(name);
    }
    return innerFunc;
}
var innerFunc = outerFunc();
innerFunc(); // decaywood
```

在上面的代码中，innerFunc就被包括在函数outerFunc内部，这时outerFunc内部的所有局部变量，对innerFunc都是可见的。但是反过来就不行。这就是JavaScript语言特有的“链式作用域”结构（chain scope），子对象会一级一级地向上寻找所有父对象的变量。所以，父对象的所有变量，对子对象都是可见的，反之则不成立。既然innerFunc可以读取outerFunc中的局部变量，那么只要把innerFunc作为返回值，我们不就可以在outerFunc外部读取它的内部变量了吗！

## 闭包基础

### 闭包的概念

闭包指可以包含自由（未绑定到特定对象）变量的代码块；这些变量不是在这个代码块内或者任何全局上下文中定义的，而是在定义代码块的环境中定义（局部变量）。“闭包” 一词来源于以下两者的结合：要执行的代码块（由于自由变量被包含在代码块中，这些自由变量以及它们引用的对象没有被释放）和为自由变量提供绑定的计算环境（作用域）。

让我们说的更透彻一些。所谓“闭包”，就是在构造函数体内定义另外的函数作为目标对象的方法函数，而这个对象的方法函数反过来引用外层函数体中的临时变量。这使得只要目标对象在生存期内始终能保持其方法，就能间接保持原构造函数体当时用到的临时变量值。尽管最开始的构造函数调用已经结束，临时变量的名称也都消失了，但在目标对象的方法内却始终能引用到该变量的值，而且该值只能通这种方法来访问。即使再次调用相同的构造函数，但只会生成新对象和方法，新的临时变量只是对应新 的值，和上次那次调用的是各自独立的。

闭包跟面向对象是一棵树上的两条枝，实现的功能是等价的。

在PHP、Scala、Scheme、Common Lisp、Smalltalk、Groovy、JavaScript、Ruby、 Python、Go、Lua、objective c、swift 以及Java（Java8及以上）等语言中都能找到对闭包不同程度的支持。

由于在JavaScript语言中，只有函数内部的子函数才能读取局部变量，因此可以把闭包简单理解成“定义在一个函数内部的函数”。所以，在本质上，闭包就是将函数内部和函数外部连接起来的一座桥梁。上一节代码中的innerFunc函数，就是闭包。


### 闭包的用途

闭包可以用在许多地方。它的最大用处有两个，一个是前面提到的可以读取函数内部的变量，另一个就是让这些变量的值始终保持在内存中。怎么来理解这句话呢？请看下面的代码。

```javascript
function outerFunc() {
    var name = "decaywood";
    function say() {
        console.info(name);
    }
    function changeWord() {
        name = "JavaScripter"
    }
    return {say: say, changeWord: changeWord};
}
var res = outerFunc();
var say = res.say;
var changeWord = res.changeWord;
say(); // decaywood
changeWord();
say(); // JavaScripter
```
在这段代码中，包含两个闭包：say和changeWord，根据运行结果大家也应该能猜出其中的机制了。say函数一共运行了两次，第一次的值是decaywood，第二次的值是JavaScripter。可以推断，函数outerFunc中的局部变量name一直保存在内存中，并没有在outerFunc调用后被自动清除。为什么会这样呢？原因就在于outerFunc是say以及changeWord的父函数，而say以及changeWord被赋给了全局变量res，这导致say以及changeWord始终在内存中，而他们的存在依赖于outerFunc，因此outerFunc也始终在内存中，不会在调用结束后，被垃圾回收机制（garbage collection）回收。具体流程现在明了了，changeWord与say函数共享一个name，两函数必然会相互影响。

### 使用闭包的注意点

* 由于闭包会使得函数中的变量都被保存在内存中，内存消耗很大，所以不能滥用闭包，否则会造成网页的性能问题，在IE中可能导致内存泄露。解决方法是，在退出函数之前，将不使用的局部变量全部删除。
* 闭包会在父函数外部，改变父函数内部变量的值。所以，如果你把父函数当作对象（object）使用，把闭包当作它的公用方法（Public Method），把内部变量当作它的私有属性（private value），这时一定要小心，不要随便改变父函数内部变量的值。

## 闭包深入

下文以此为例：

```javascript
function outerFunc() {
    var name = "decaywood";
    function innerFunc() {
        console.info(name);
    }
    return innerFunc;
}
var res = outerFunc();
res(); // decaywood
```

如果要更加深入的了解闭包以及函数outerFunc和嵌套函数innerFunc的关系，我们需要引入另外几个概念：函数的执行环境(excution context)、活动对象(call object)、作用域(scope)、作用域链(scope chain)。并以函数outerFunc从定义到执行的过程为例阐述这几个概念。

* 当定义函数outerFunc的时候，js解释器会将函数outerFunc的作用域链(scope chain)设置为其在定义时所在的“环境”，如果outerFunc是一个全局函数，则scope chain中只有window对象。

* 当执行函数outerFunc的时候，函数会进入相应的执行环境(excution context)。在创建执行环境的过程中，首先会为函数添加一个scope属性，即outerFunc的作用域，其值就为第1步中的scope chain。

* 然后执行环境会创建一个活动对象(call object)。活动对象也是一个拥有属性的对象，但它不具有原型而且不能通过JavaScript代码直接访问。创建完活动对象后，把活动对象添加到outerFunc的作用域链的最顶端。此时函数的作用域链包含了两个对象：活动对象和window对象。

* 下一步是在活动对象上添加一个arguments属性，它保存着调用outerFunc函数时所传递的参数。最后把所有函数的形参和内部的函数innerFunc的引用也添加到outerFunc的活动对象上。在这一步中，完成了innerFunc函数的定义，因此如同第3步，innerFunc函数的作用域链被设置为其所被定义的环境，即outerFunc的作用域。

到此，整个函数outerFunc从定义到执行的步骤就完成了。此时outerFunc返回函数innerFunc的引用给res，又innerFunc函数的作用域链包含了对函数outerFunc的活动对象的引用，也就是说内部函数可以访问到外部函数中定义的所有变量和函数。innerFunc被res引用，同时又依赖函数outerFunc，因此outerFunc函数在返回后是不会被GC回收的。

当innerFunc函数执行的时候亦会像以上步骤一样。因此，其作用域链包含了3个对象：自身的活动对象、outerFunc的活动对象以及window对象，如下图所示：

<img src="{{site.cdnurl}}/img/post/2016/JavaScript-closure.svg" alt="SVG" style="background-color:white">

如图所示，当在innerFunc中访问一个变量的时候，搜索顺序是：

先搜索自身的活动对象，如果存在则返回，如果不存在将继续搜索outerFunc的活动对象，依次查找，直到找到为止。如果函数innerFunc存在prototype原型对象，则在查找完自身的活动对象后先查找自身的原型对象，再继续查找。这就是JavaScript中的变量查找机制。如果整个作用域链上都无法找到，则返回undefined。

**小结**

本段中提到了两个重要的词语：函数的定义与执行。文中提到函数的作用域是在定义函数时候就已经确定，而不是在执行的时候确定。用一段代码来说明这个问题：

```javascript
function func(x) { 
  var ret = function () { return x; }
  return ret;
}
var res = func(1);
console.info(res());
```

这段代码中变量res指向了func中的那个匿名函数(由ret返回)。假设函数res的作用域是在执行alert(res())确定的，那么此时res的作用域链是：

res的活动对象->info的活动对象->window对象。

否则如果函数res的作用域是在定义时确定的，res的作用域链为：

res的活动对象->func的活动对象->window对象。

如果第一种假设成立，那输出值就是undefined；如果第二种假设成立，输出值则为1。运行结果证明了第2个假设是正确的，说明函数的作用域确实是在定义这个函数的时候就已经确定了。

## 闭包的应用场景

以本人开发的一个项目为例，项目中有个动画展示的需求，要求实现一个接口，给定起点以及终点还有指定图标。能够重复渲染指定图标从起点到终点的移动的动画：

```javascript
// 为了减小篇幅，采用伪代码
function tracking_animate (from, to, ref) {
    var time = 1000 / 60; // 60帧
    var id = setInterval(function () {
        var moving = calculate_point(from, to);
        rendering(moving, ref);
        ...
    }, time);
    ...
}
```

可以看到，setInterval传入的匿名函数使用了外部tracking\_animate的三个形参以及一个局部变量time，故形成了一个闭包。及时调用多次，动画之间是不会相互影响的，不需要对数据进行特别的维护。这就是闭包带来的好处。

**进一步的优化**

上面的代码虽然优雅，但是由于每调用一次都会注册一个定时函数，在底层的event loop事件队列会堆积多个callback，如果调用次数多的话会造成可观的系统负载。我们将这个接口优化一下：

```javascript
// 为了减小篇幅，采用伪代码
var tracking = undefined;
var time = 1000 / 60; // 60帧
var id = setInterval(function () {
        if (tracking) {
            for (var index in tracking) 
                tracking[index]();
        }
    }, time);

function tracking_animate (from, to, ref) {
    
    tracking = tracking || [];
    var func = function () {
        var moving = calculate_point(from, to);
        rendering(moving, ref);
        ...
    }
    tracking.push(func);
    ...
}
```

优化思路是将闭包存入一个数组中维护，在一个定时函数中一次性将多个绘制动作执行完，而不是将每个绘制动作单独注册到定时函数中。结果很明显，第二种做法将浏览器级别的调用减少到了常数级而不是线性相关的。性能提高根据tracking\_animate的调用次数而定，10次调用时大概能有30%的性能提升。

## JavaScript的垃圾回收机制

在JavaScript中，如果一个对象不再被引用，那么这个对象就会被GC回收。如果两个对象互相引用，而不再被第3者所引用，那么这两个互相引用的对象也会被回收。以本文中例子来说，因为outerFunc被innerFunc引用，innerFunc又被res引用，这就是为什么outerFunc执行后不会被回收的原因。

## Java中的闭包

其实Java在很早的版本就支持闭包了，只是因为应用场景太少，这个概念一直没得到推广。在Java6里，我们可以这样写：

```java
public static Supplier<String> javaClosure(){
    final String name = "decaywood";
    return new Supplier<String>() {
        @Override
        public String get() {
            return name;
        }
    };
}

public interface Supplier<T> {
    T get();
}
```

这里name是函数javaClosure的内部变量，但是最终返回里的匿名对象里，仍然返回了name。我们知道，函数的局部变量，其作用域仅限于函数内部，在函数结束时，就应该是不可见状态，而闭包则将name的生存周期延长了，并且使得变量可以被外部函数所引用。这就是闭包了。

而支持lambda表达式的语言，一般也会附带着支持闭包了，因为lambda总归在函数内部，与函数局部变量属于同一语句块，如果不让它引用局部变量，不会让人很别扭么？例如Python的lambda定义我觉得是最符合λ算子的形式的，我们可以这样定义lambda：

```python
greeting = "hello, "
talk_to = lambda x: greeting + x + "!"
print talk_to("decaywood") # hello, decaywood!
greeting = "good bye, "
print f("decaywood") # good bye, decaywood!
```

**Java中闭包带来的问题**

在Java的经典著作《Effective Java》、《Java Concurrency in Practice》里经常能看到类似忠告：匿名函数里的变量引用，也叫做变量引用泄露，会导致线程安全问题，因此在Java8之前，如果在匿名类内部引用函数局部变量，必须将其声明为final，即不可变对象。(Python和Javascript从一开始就是为单线程而生的语言，一般也不会考虑这样的问题，所以它的外部变量是可以任意修改的)。

在Java8里，有了一些改动，现在我们可以这样写lambda或者匿名类了：

```java
public static Supplier<String> javaClosure() {
    String name = "decaywood";
    return () -> {
        return name;
    };
}
```

这里我们不用写final了！但是，引用泄露问题怎么办呢？其实，问题本质没有变，只是Java8这里加了一个语法糖：在lambda表达式以及匿名类内部，如果引用某局部变量，则直接将其视为final。

```java
public static Supplier<String> javaClosure() {
    String name = "decaywood";
    name = "programmer";
    return () -> {
        return name; // compile error
    };
}
```

其实这里仅仅是将final的定义工作交给了编译器完成，这里name会强制被理解成final类型。有意思的是编译错误出现在lambda表达式内部引用name的地方，而不是第二次赋值的位置。这也是Java的lambda的一个被人诟病的地方。

对于单线程的语言，闭包是一种有效减少代码量的编程技巧，然而对于多线程语言，闭包则是避之不及的语言陷阱。所以，在进行编码时，这是一定要注意的地方。
 
## 结语

理解JavaScript的闭包是迈向高级JS程序员的必经之路，理解了其解释和运行机制才能写出更为安全和优雅的代码。
