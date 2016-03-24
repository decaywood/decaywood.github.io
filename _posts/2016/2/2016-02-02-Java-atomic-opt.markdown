---
layout:     post
random-img: true
title:      关于原子操作
subtitle:   About Atomic Operation
date:       2016-02-02 01:36:29
author:     decaywood
description: 本文让我们一起来聊一聊在Inter处理器和Java里是如何实现原子操作的。
keywords: CAS,原子操作,锁
tags:
    - Java
    - JVM
    - 并发编程
---

## 前言

原子（atom）本意是“不能被进一步分割的最小粒子”，而原子操作（atomic operation）意为”不可被中断的一个或一系列操作” 。在多处理器上实现原子操作就变得有点复杂。本文让我们一起来聊一聊在Inter处理器和Java里是如何实现原子操作的。

## 术语定义

|术语名称|英文|解释|
|---|---|---|
比较并交换|Compare and Swap	CAS|操作需要输入两个数值，一个旧值（期望操作前的值）和一个新值，在操作期间先比较下在旧值有没有发生变化，如果没有发生变化，才交换成新值，发生了变化则不交换。|
|CPU流水线|CPU pipeline|CPU流水线的工作方式就象工业生产上的装配流水线，在CPU中由5~6个不同功能的电路单元组成一条指令处理流水线，然后将一条X86指令分成5~6步后再由这些电路单元分别执行，这样就能实现在一个CPU时钟周期完成一条指令，因此提高CPU的运算速度。|
|内存顺序冲突|Memory order violation|内存顺序冲突一般是由伪共享引起，伪共享是指多个CPU同时修改同一个缓存行的不同部分而引起其中一个CPU的操作无效，当出现这个内存顺序冲突时，CPU必须清空流水线。|

## 处理器如何实现原子操作

32位IA-32处理器使用基于对缓存加锁或总线加锁的方式来实现多处理器之间的原子操作。

### 处理器自动保证基本内存操作的原子性

**首先处理器会自动保证基本的内存操作的原子性**。处理器保证从系统内存当中读取或者写入一个字节是原子的，意思是当一个处理器读取一个字节时，其他处理器不能访问这个字节的内存地址。奔腾6和最新的处理器能自动保证单处理器对同一个缓存行里进行16/32/64位的操作是原子的，但是复杂的内存操作处理器不能自动保证其原子性，比如跨总线宽度，跨多个缓存行，跨页表的访问。但是处理器提供总线锁定和缓存锁定两个机制来保证复杂内存操作的原子性。

### 使用总线锁保证原子性

**第一个机制是通过总线锁保证原子性**。如果多个处理器同时对共享变量进行读改写（i++就是经典的读改写操作）操作，那么共享变量就会被多个处理器同时进行操作，这样读改写操作就不是原子的，操作完之后共享变量的值会和期望的不一致，举个例子：如果i=1,我们进行两次i++操作，我们期望的结果是3，但是有可能结果是2 :

|CPU1|CPU2|
|---|---|---|
|step1|i = 1|i = 1|
|step2|i + 1|i + 1|
|step3|i = 2|i = 2|

原因是有可能多个处理器同时从各自的缓存中读取变量i，分别进行加一操作，然后分别写入系统内存当中。那么想要保证读改写共享变量的操作是原子的，就必须保证CPU1读改写共享变量的时候，CPU2不能操作缓存了该共享变量内存地址的缓存。

**处理器使用总线锁就是来解决这个问题的**。所谓总线锁就是使用处理器提供的一个LOCK＃信号，当一个处理器在总线上输出此信号时，其他处理器的请求将被阻塞住,那么该处理器可以独占使用共享内存。

### 使用缓存锁保证原子性

**第二个机制是通过缓存锁定保证原子性**。在同一时刻我们只需保证对某个内存地址的操作是原子性即可，但总线锁定把CPU和内存之间通信锁住了，这使得锁定期间，其他处理器不能操作其他内存地址的数据，所以总线锁定的开销比较大，最近的处理器在某些场合下使用缓存锁定代替总线锁定来进行优化。

频繁使用的内存会缓存在处理器的L1，L2和L3高速缓存里，那么原子操作就可以直接在处理器内部缓存中进行，并不需要声明总线锁，在奔腾6和最近的处理器中可以使用“缓存锁定”的方式来实现复杂的原子性。所谓“缓存锁定”就是如果缓存在处理器缓存行中内存区域在LOCK操作期间被锁定，当它执行锁操作回写内存时，处理器不在总线上声言LOCK＃信号，而是修改内部的内存地址，并允许它的缓存一致性机制来保证操作的原子性，因为缓存一致性机制会阻止同时修改被两个以上处理器缓存的内存区域数据，当其他处理器回写已被锁定的缓存行的数据时会起缓存行无效，在例1中，当CPU1修改缓存行中的i时使用缓存锁定，那么CPU2就不能同时缓存了i的缓存行。

**但是有两种情况下处理器不会使用缓存锁定**。

**第一种情况是**：当操作的数据不能被缓存在处理器内部，或操作的数据跨多个缓存行（cache line），则处理器会调用总线锁定。

**第二种情况是**：有些处理器不支持缓存锁定。对于Inter486和奔腾处理器,就算锁定的内存区域在处理器的缓存行中也会调用总线锁定。

以上两个机制我们可以通过Inter处理器提供了很多LOCK前缀的指令来实现。比如位测试和修改指令BTS，BTR，BTC，交换指令XADD，CMPXCHG和其他一些操作数和逻辑指令，比如ADD（加），OR（或）等，被这些指令操作的内存区域就会加锁，导致其他处理器不能同时访问它。

## Java如何实现原子操作

在java中可以通过**锁**和**循环CAS**的方式来实现原子操作。

### 使用循环CAS实现原子操作

JVM中的CAS操作正是利用了上一节中提到的处理器提供的CMPXCHG指令实现的。自旋CAS实现的基本思路就是循环进行CAS操作直到成功为止，以下代码实现了一个基于CAS线程安全的计数器方法safeCount和一个非线程安全的计数器count。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author: decaywood
 * @date: 2016/02/01 23:44
 */
public class AtomicOperation {

    private AtomicInteger atomicInteger = new AtomicInteger(0);
    private long i = 0;

    /**
     * 使用CAS实现线程安全计数器
     */
    private void safeCount() {
        for (;;) {
            int i = atomicInteger.get();
            boolean suc = atomicInteger.compareAndSet(i, ++i);
            if (suc) break;
        }
    }

    /**
     * 非线程安全计数器
     */
    private void count() { i++; }

    public void run() throws Exception {
        long start = System.currentTimeMillis();
        ExecutorService executor = Executors.newFixedThreadPool(50);
        for (int tCount = 0; tCount < 100; tCount++) {
            executor.execute(() -> {
                for (int countN = 0; countN < 5000; countN++) {
                    this.count();
                    this.safeCount();
                }
            });
        }
        executor.shutdown();
        executor.awaitTermination(100, TimeUnit.SECONDS);

        System.out.println("unsafe count : " + this.i);
        System.out.println("safe count : " + this.atomicInteger.get());
        System.out.println("cost : " + System.currentTimeMillis() - start);
    }

    public static void main(String[] args) throws Exception {
        new AtomicOperation().run();
    }
}
```

结果(结果不一定一致):

```bash
unsafe count : 493994
safe count : 500000
cost : 203
```
从Java1.5开始JDK的并发包里提供了一些类来支持原子操作，如**AtomicBoolean**（用原子方式更新的 boolean 值），**AtomicInteger**（用原子方式更新的 int 值），**AtomicLong**（用原子方式更新的 long 值），这些原子包装类还提供了有用的工具方法，比如以原子的方式将当前值自增1和自减1。

在Java并发包中有一些并发框架也使用了自旋CAS的方式来实现原子操作，比如LinkedTransferQueue类的Xfer方法。CAS虽然很高效的解决原子操作，但是CAS仍然存在三大问题。ABA问题，循环时间长开销大和只能保证一个共享变量的原子操作。

**ABA问题**

因为CAS需要在操作值的时候检查下值有没有发生变化，如果没有发生变化则更新，但是如果一个值原来是A，变成了B，又变成了A，那么使用CAS进行检查时会发现它的值没有发生变化，但是实际上却变化了。ABA问题的解决思路就是使用版本号。在变量前面追加上版本号，每次变量更新的时候把版本号加一，那么A－B－A 就会变成1A-2B－3A。

从**Java1.5**开始JDK的atomic包里提供了一个**AtomicStampedReference**类来解决ABA问题。这个类的compareAndSet方法作用是首先检查当前引用是否等于预期引用，并且当前标志是否等于预期标志，如果全部相等，则以原子方式将该引用和该标志的值设置为给定的更新值。

```java
public boolean compareAndSet(
    V expectedReference,      //预期引用
    V newReference,           //更新后的引用
    int expectedStamp,        //预期标志
    int newStamp              //更新后的标志
)
```

**循环时间长开销大**

自旋CAS如果长时间不成功，会给CPU带来非常大的执行开销。如果JVM能支持处理器提供的pause指令那么效率会有一定的提升，pause指令有两个作用 :

第一 : 它可以延迟流水线执行指令（de-pipeline）,使CPU不会消耗过多的执行资源，延迟的时间取决于具体实现的版本，在一些处理器上延迟时间是零。

第二 : 它可以避免在退出循环的时候因内存顺序冲突（memory order violation）而引起CPU流水线被清空（CPU pipeline flush），从而提高CPU的执行效率。

**只能保证一个共享变量的原子操作**

当对一个共享变量执行操作时，我们可以使用循环CAS的方式来保证原子操作，但是对多个共享变量操作时，循环CAS就无法保证操作的原子性，这个时候就可以用锁，或者有一个取巧的办法，就是把多个共享变量合并成一个共享变量来操作。比如有两个共享变量i＝2,j=a，合并一下ij=2a，然后用CAS来操作ij。**从Java1.5开始JDK提供了AtomicReference类来保证引用对象之间的原子性，你可以把多个变量放在一个对象里来进行CAS操作**。

### 使用锁机制实现原子操作

锁机制保证了只有获得锁的线程能够操作锁定的内存区域。JVM内部实现了很多种锁机制，有偏向锁，轻量级锁和互斥锁，有意思的是除了偏向锁，JVM实现锁的方式都用到的循环CAS，当一个线程想进入同步块的时候使用循环CAS的方式来获取锁，当它退出同步块的时候使用循环CAS释放锁。