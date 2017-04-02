---
layout:     post
random-img: true
title:      JavaScript的 Event Loop 模型
subtitle:   The JavaScript Event Loop
date:       2016-04-05 12:44:31
author:     decaywood
description: 本文将介绍一些有关JavaScript并发模型的一些核心概念，包括event loop和消息队列等...
keywords: JavaScript,event loop
tags:
    - JavaScript
    - 并发编程
---

## 前言

现如今，作为浏览器脚本语言的JavaScript几乎无处不在。作为软件开发人员，接触JavaScript语言也是不可避免的。由于项目需要，本人接触这门语言也有将近一年了。写这篇文章的原因也是对JavaScript语言本身的编程模型做一个总结，借以巩固自己对JavaScript的理解，并希望举一反三，通过了解其独特的编程模型，进一步消化吸收，提高自己知识的深度与广度。本文将介绍一些有关JavaScript并发模型的一些核心概念，包括event loop和消息队列等...

## 非阻塞IO

关于阻塞与非阻塞，如果不了解的话可以看看本博客[Linux下的五种IO模型](/2016/01/07/web-io-model/)这篇文章。

由于JavaScript是单线程执行的，若IO操作阻塞的话会导致程序完全阻塞住，如果在浏览器环境运行的话，将出现卡死现象，严重影响用户体验。所以，在JavaScript中，绝大多数IO操作都是非阻塞的，其中包括：HTTP请求，数据库操作以及磁盘读写（Node.js）。当遇到IO操作时，程序只需要提供一个回调函数就可以继续往下执行而不必等待IO操作完成。当IO操作完成后，完成消息将绑定对应的回调函数压入消息队列。在未来某个时刻（主线程以及消息队列排在当前消息前面的回调执行完毕后），消息出队，回调函数将触发执行。

下面以一个http请求为例子，根据其输出对两种风格的模型进行对比：

```python
conn = httplib.HTTPConnection("http://www.google.com")  
conn.request(...)  
response = conn.getresponse()  
print respons
print "done!" 
```

运行结果：

```
xxx
done!
```

流程很简单：

1. 请求方法执行，执行线程等待直到接收到响应
2. 接收到来自Google的响应并返回
3. 将返回值输出到控制台
4. “done”输出至控制台

同一种功能的JavaScript实现如下：

```javascript
request('http://www.google.com', function(error, response, body) {
  console.log(body);
});
console.log('Done!');
```

运行结果：

```
done!
xxx
```

虽然写法上差别不大，但是输出却大相径庭。以下为程序具体执行流程：

1. 请求函数执行，传入匿名函数作为响应返回后的回调函数
2. "done!"被立即输出至控制台
3. 未来某个时刻，接收到来自Google的响应，回调函数被执行，输出响应信息

## Event Loop

由于在请求时不需要等待响应返回，程序可以在执行完请求函数后无需等待响应继续执行其他逻辑，当异步请求完成后，再执行其回调函数就行了。不过这里需要明确几个问题：回调函数寄存在哪？以什么顺序进行执行？由什么触发回调？

### 消息队列（Message Queue）

JavaScript运行环境包含一个消息队列，消息队列存储了一系列待处理的消息，这些消息与对应的回调函数绑定在一起。当绑定了回调函数的外部事件（例如鼠标点击、接收到HTTP请求的响应等）被触发，消息将进入消息队列等待处理。但如果事件没有绑定回调函数，消息是不会入队的。

### 事件循环（Event Loop）

在一次循环中，消息队列出队一个消息，并执行对应的回调函数，每一次出队我们称作"tick"；举一个例子：

```javascript
function init_func() {
    var func1 = function () {
        var func2 = function () {
            var func3 = function () {
                var success = function() {
                    console.log("success!");
                };
                request('http://www.google.com', success);
                console.log('Done!');
            };
            func3();
        };
        func2();
    };
    func1();
}
init_func();
```

首先，上面的程序定义了5个函数，分别为init\_func、func1、2、3以及success。init\_func作为调用栈的初始帧，由于JavaScript是单线程执行的，故只有在栈中的函数都返回后，消息队列中消息绑定的回调函数才会执行。以上面的程序为例，当执行init\_func时，在函数内部又调用了func1，此时func1入栈，func1内部又调用了func2，继续入栈...以此类推，直到func3内部调用了请求Google并传入了success回调。这一步完成后，func3、2、1、init\_func的栈帧相继弹出。可能在此期间，Google的响应被接收了，绑定了success回调函数的message入栈了。不过无论message何时入栈，都要等待调用栈中所有帧都被弹出后才会触发一次"tick"，此时success回调才被执行（细节在下一节讨论）。具体原理图如下：

<img src="{{site.cdnurl}}/img/post/2016/JavaScript-EventLoop.svg" alt="SVG" style="background-color:white">

需要注意的是，与HTTP请求不同，用户事件（比如click）是一直存在的，只要用户有点击动作，新的message就会不断的入队，而不像上面的例子一次性入队。每当message出队回调函数会不断被执行。

## 回调函数的执行时机

如果代码中调用了一个异步函数（比如下面的setTimeout），消息，会新生成一个消息入队，在Event Loop未来的某次tick中出队并调用与之绑定的回调函数。

```javascript
function func() {
  console.info("foo");
  setTimeout(tick, 0);
  console.info("baz");
  func2();
}
function tick() {
  console.info("bar");
}
function func2() {
  console.info("blix");
}
func();
```

在这个例子中，setTimeout被调用，传入了回调函数tick以及时间间隔0毫秒。经过指定时间后（几乎是立即），一个与当前独立的消息入队，并绑定回调函数tick。调用栈中所有帧弹出后，执行队列中消息出队并执行所绑定的回调函数。具体输出如下：

```
foo
baz
blix
baz
```

如果在func中连续调用多个setTimeout函数，则回调函数执行顺序依赖setTimeout执行先后顺序。

## 闭包

JavaScript对[闭包](/2016/04/02/Javascript-closure-intro/)的支持允许回调函数在执行时访问其外部的上下文，上下文在声明回调的函数弹出调用栈后仍然有效。考虑下面的例子：

```javascript
function say_hello() {
    var name = "programmer";
    console.info("hello, decaywood!");
    var say_hello_again = function() {
        console.info("hello, " + name + "!")
    };
    setTimeout(say_hello_again, 1000);
}
say_hello();
```

在这个例子中，say\_hello函数被执行时定义了变量name。之后setTimeout函数被执行，约1000毫秒后，绑定了say\_hello\_again回调的消息入队。之后say\_hello函数返回，栈帧弹出结束第一个消息的处理，但name变量仍然可以通过闭包被引用，而不是被垃圾回收。当第二个消息被处理(say\_hello\_again回调)，它保持了对在外部函数上下文中声明的name变量的访问。一旦回调函数执行结束，header变量可以被垃圾回收。

执行结果：

```
hello, decaywood!
hello, programmer!
```

## 结语

JavaScript事件驱动的交互模型不同于许多程序员习惯的请求-响应模型，但如你所见，它并不复杂。使用简单的消息队列和事件循环，JavaScript使得开发人员在构建他们的系统时使用大量asynchronously-fired（异步-触发）回调函数，让运行时环境能在等待外部事件触发的同时处理并发操作。然而，这不过是并发的一种方法而已。