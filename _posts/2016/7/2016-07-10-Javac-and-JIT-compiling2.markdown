---
layout:     post
random-img: true
title:      Javac编译与JIT编译2「转」
subtitle:   Javac & JIT compiling 2
date:       2016-07-10 13:46:53
author:     decaywood
description: 本文介绍了Java中编译过程的原理
keywords: Jit,Javac,编译,优化
tags:
    - JVM
    - Java
---

## JIT的起源

上一篇文章[Javac编译与JIT编译](/2016/06/10/Javac-and-JIT-compiling/)简略讲述了Java compiler(javac)。可以看出javac和C的compiler不一样， 并不是直接将 Java 的源代码 编译成成处理器的指令。 相反地，它产生的是统一规格、与机器 binary 格式无关的 bytecode。 在执行期，JVM 会逐条解释执行 bytecode， 这是为什么 Java 在跨平台上会这么成功的主要原因， 你可以在某个平台上写完、build 一份，然后在其他的平台上头执行。 但是这也导致了严重的问题， interpret 通常比直接 compile 成 平台限定的原生 binary 码来得慢。 Sun 在 90 年代后期就已经了解这个严重度， 当时他们请了 Cliff Click 博士来提供解决方案。

## Hot Spot

他们在虚拟机中引入了JIT编译器（即时编译器），当虚拟机发现某个方法或代码块运行特别频繁时，就会把这些代码认定为“Hot Spot Code”（热点代码），为了提高热点代码的执行效率，在运行时，虚拟机将会把这些代码编译成与本地平台相关的机器码，并进行各层次的优化，完成这项任务的正是JIT编译器。 在某些情况下，调整好的最佳化 JVM 效能可能超过手工的 C++ 或 C。 现在主流的商用虚拟机（如Sun HotSpot、IBM J9）中几乎都同时包含解释器和编译器。当程序需要迅速启动和执行时，解释器可以首先发挥作用，省去编译的时间，立即执行；当程序运行后，随着时间的推移，编译器逐渐会返回作用，把越来越多的代码编译成本地代码后，可以获取更高的执行效率。解释执行可以节约内存，而编译执行可以提升效率。 运行过程中会被即时编译器编译的“Hot Spot Code”有两类：

* 被多次调用的方法
* 被多次调用的循环体

两种情况，编译器都是以整个方法作为编译对象，这种编译也是虚拟机中标准的编译方式。要知道一段代码或方法是不是热点代码，是不是需要触发即时编译，需要进行Hot Spot Detection（热点探测）。目前主要的热点 判定方式有以下两种：

* 基于采样的热点探测：采用这种方法的虚拟机会周期性地检查各个线程的栈顶，如果发现某些方法经常出现在栈顶，那这段方法代码就是“Hot Spot Code”。这种探测方法的好处是实现简单高效，还可以很容易地获取方法调用关系，缺点是很难精确地确认一个方法的热度，容易因为受到线程阻塞或别的外界因素的影响而扰乱热点探测。
* 基于计数器的热点探测：采用这种方法的虚拟机会为每个方法，甚至是代码块建立计数器，统计方法的执行次数，如果执行次数超过一定的阀值，就认为它是“热点方法”。这种统计方法实现复杂一些，需要为每个方法建立并维护计数器，而且不能直接获取到方法的调用关系，但是它的统计结果相对更加精确严谨。

## 具体实例

下面看一段JIT提高程序性能的例子

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.get();
         z = wrapper.get();
         sum = y + z;
     }
 }

 class Wrapper {
     final int value;
     final int get() {
         return value;
     }
 }
```

上面这是一段开发人员写的代码，假设这段代码是 Hot Spot

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.value;
         sum = y + y;
     }
 }

 class Wrapper {
     final int value;
     final int get() {
         return value;
     }
 }
```

这是HotSpot VM经过Hot Spot Detection 后对代码进行优化的等价结果，当然JIT是将 bytecode 编译成本地机器码，这里展示的是优化后与之等价的源代码。 

看上面的编译优化，首先是:

1、inline method(方法内联) 用 b.value 取代 wrapper.get()， 不透过函数呼叫而直接存取 wrapper.value 来减少延迟。

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.value;
         z = wrapper.value;
         sum = y + z;
     }
 }
```

2、移除多余的载入：用 z = y 取代 z = wrapper.value， 所以只存取区域变量而不是 wrapper.value 来减少延迟。

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.value;
         z = y;
         sum = y + z;
     }
 }
```

3、copy propagation(复写传播)：用 y = y 取代 z = y， 没有必要再用一个变量 z，因为 z 跟 y 会是相等的。

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.value;
         y = y;
         sum = y + y;
     }
 }
```
4、消除不用的源代码：y = y 是不必要的，可以消灭掉。

```java
 class Calculator {
     Wrapper wrapper;
     public void calculate() {
         y = wrapper.value;
         sum = y + y;
     }
 }
```

以上是单个类里面的优化，下面看有继承关系的优化

```java
 public interface Animal {
     public void eat();
 }
 
 public class Cat implements Animal{
     public void eat() {
         System.out.println("cat eat fish");
     }
 }

 public class Test{
     public void methodA(Animal animal){
         animal.eat();
     }
 }
```

首先分析Animal的整个”类型继承关系”，发现只有一个实现类Cat，那么在methodA(Animal animal)的代码就可以优化为如下，

```java
 public void methodA(Animal animal){
     System.out.println("cat eat fish");
 }
```
但是，如果之后在运行过程中，”类型继承关系”发现Animal又多了一个实现类Dog，那么此时就不在执行之前优化编译好的机器码了，而是进行解释执行，即如下的”逆优化”。 逆优化： 当编译后的机器码的执行不再符合优化条件，则该机器码对应的部分回到解释执行。 以上介绍的都是C1优化，还有主要用于服务端程序优化的C2优化，这里就不再介绍了。
