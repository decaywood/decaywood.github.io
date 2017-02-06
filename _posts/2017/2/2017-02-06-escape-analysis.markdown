---
layout:     post
random-img: true
title:      JVM中的逃逸分析
subtitle:   Escape analysis in JVM
date:       2017-02-06 16:12:35
author:     decaywood
description: Git 的一些常用操作备忘。
keywords: JVM,escape analysis
tags:
    - Java
    - JVM
---

逃逸分析(Escape Analysis)是目前Java虚拟机中比较前沿的优化技术。基本行为就是分析对象动态作用域：当一个对象在方法中被定义后，它可能被外部方法所引用，例如作为调用参数传递到其他地方中，称为方法逃逸。例如：

```java
public static StringBuffer craeteStringBuffer(String s1, String s2) {
        StringBuffer sb = new StringBuffer();
        sb.append(s1);
        sb.append(s2);
        return sb;
}
```

StringBuffer sb是一个方法内部变量，上述代码中直接将sb返回，这样这个StringBuffer有可能被其他方法所改变，这样它的作用域就不只是在方法内部，虽然它是一个局部变量，称其逃逸到了方法外部。甚至还有可能被外部线程访问到，譬如赋值给类变量或可以在其他线程中访问的实例变量，称为线程逃逸。上述代码如果想要StringBuffer sb不逃出方法，可以这样写：

```java
public static String createStringBuffer(String s1, String s2) {
        StringBuffer sb = new StringBuffer();
        sb.append(s1);
        sb.append(s2);
        return sb.toString();
}
```

不直接返回 StringBuffer，那么StringBuffer将不会逃逸出方法。如果能证明一个对象不会逃逸到方法或线程外，则可能为这个变量进行一些高效的优化。

**栈上分配**

我们都知道Java中的对象都是在堆上分配的，而垃圾回收机制会回收堆中不再使用的对象，但是筛选可回收对象，回收对象还有整理内存都需要消耗时间。如果能够通过逃逸分析确定某些对象不会逃出方法之外，那就可以让这个对象在栈上分配内存，这样该对象所占用的内存空间就可以随栈帧出栈而销毁，就减轻了垃圾回收的压力。在一般应用中，如果不会逃逸的局部对象所占的比例很大，如果能使用栈上分配，那大量的对象就会随着方法的结束而自动销毁了。

**同步消除**

这一块以前提到过，请参考[JVM中的锁优化](/2016/05/02/lock-optimization-of-JVM/) 锁的优化和注意事项中锁削除章节

**标量替换**

Java虚拟机中的原始数据类型（int，long等数值类型以及reference类型等）都不能再进一步分解，它们就可以称为标量。相对的，如果一个数据可以继续分解，那它称为聚合量，Java中最典型的聚合量是对象。如果逃逸分析证明一个对象不会被外部访问，并且这个对象是可分解的，那程序真正执行的时候将可能不创建这个对象，而改为直接创建它的若干个被这个方法使用到的成员变量来代替。拆散后的变量便可以被单独分析与优化，可以各自分别在栈帧或寄存器上分配空间，原本的对象就无需整体分配空间了。

**总结**

虽然概念上的JVM总是在Java堆上为对象分配空间，但并不是说完全依照概念的描述去实现；只要最后实现处理的“可见效果”与概念中描述的一直就没问题了。所以说，“you can cheat as long as you don’t get caught”。Java对象在实际的JVM实现中可能在GC堆上分配空间，也可能在栈上分配空间，也可能完全就消失了。这种行为从Java源码中看不出来，也无法显式指定，只是聪明的JVM自动做的优化而已。

但是逃逸分析会有时间消耗，所以性能未必提升多少，并且由于逃逸分析比较耗时，目前的实现都是采用不那么准确但是时间压力相对较小的算法来完成逃逸分析，这就可能导致效果不稳定，要慎用。

由于HotSpot虚拟机目前的实现方法导致栈上分配实现起来比较复杂，因为在HotSpot中暂时还没有做这项优化。