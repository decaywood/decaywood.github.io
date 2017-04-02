---
layout:     post
random-img: true
title:      JVM参数详解，以及一些常见OOM问题
subtitle:   Summary of JVM Parameters & Some OOM Problems
date:       2016-01-05 20:38:50
author:     decaywood
description: JVM Java虚拟机参数设值详解 OOM问题
keywords: JVM,虚拟机,Out Of Memory
tags:
    - Java
    - JVM
---

最近一直把精力放在开发博客功能上面，很久没关注Java虚拟机底层的一些东西了，温故而知新，这次重新回顾一下JVM的一些参数。

## JVM参数

### 堆的限制

JVM中最大堆大小有三方面限制:

* 相关操作系统的数据模型（32-bt还是64-bit）限制
* 系统的可用虚拟内存限制
* 系统的可用物理内存限制

32位系统下，一般限制在1.5G~2G；64为操作系统对内存无限制

### 堆参数

* -Xmx:
指定JVM的最大堆大小，如:-Xmx=2g

* -Xms:
指定JVM的最小堆大小，如:-Xms=2g，高并发应用，建议和-Xmx一样，防止因为内存收缩／突然增大带来的性能影响。

* -Xmn:
指定JVM中NewGeneration的大小，如:-Xmn256m。这个参数很影响性能，如果程序需要比较多的临时内存，可以适当设置高点。

* -XX:PermSize:
指定JVM中PermGeneration的最小值，如:-XX:PermSize=32m，在Java8中此参数被忽略，永久代由[元空间](#meta)代替。

* -XX:MaxPermSize:
指定JVM中PermGeneration的最大值，如:-XX:MaxPermSize=64m，在Java8中此参数被忽略，永久代由[元空间](#meta)代替。

* -Xss:
指定线程桟大小，如:-Xss128k，一般来说，WEB框架下的应用需要256K，如果程序有大规模的递归行为，可以设置到512K／1M。这个需要全面的测试才能知道。不过，256K已经很大了。这个参数对性能的影响比较大的。

* -XX:NewRatio:
指定JVM中OldGeneration堆与NewGeneration的比例（OldSize/NewSize），在使用CMSGC(Concurrent Mark-Sweep GC)的情况下此参数失效，如:-XX:NewRatio=2

* -XX:SurvivorRatio:
指定NewGeneration中EdenSpace与一个SurvivorSpace的堆size比例，-XX:SurvivorRatio=8，那么在总共NewGeneration为10m的情况下，EdenSpace为8m

* -XX:MinHeapFreeRatio:
指定JVMheap在使用率小于n的情况下，heap进行收缩，Xmx==Xms的情况下无效，如:-XX:MinHeapFreeRatio=30

* -XX:MaxHeapFreeRatio:
指定JVMheap在使用率大于n的情况下，heap进行扩张，Xmx==Xms的情况下无效，如:-XX:MaxHeapFreeRatio=70

* -XX:LargePageSizeInBytes:
指定Java堆的分页页面大小，如:-XX:LargePageSizeInBytes=128m

<h3 id="meta">元空间</h3>

持久代的空间被彻底地删除了，它被一个叫元空间的区域所替代了。持久代删除了之后，很明显，JVM会忽略PermSize和MaxPermSize这两个参数，还有就是你再也看不到java.lang.OutOfMemoryError: PermGen error的异常了。

JDK 8的HotSpot JVM现在使用的是本地内存来表示类的元数据，这个区域就叫做元空间,绝大多数的类元数据的空间都从本地内存中分配。


### 垃圾收集器参数

* -XX:+UseParallelGC:
指定在NewGeneration使用ParallelCollector，并行收集，暂停APPThreads，同时启动多个垃圾回收Thread，不能和CMSGC一起使用.系统吨吐量优先，但是会有较长时间的AppPause，后台系统任务可以使用此GC。

* -XX:ParallelGCThreads:
指定parallelcollection时启动的Thread个数，默认是物理Processor的个数，

* -XX:+UseParallelOldGC:
指定在OldGeneration使用ParallelCollector

* -XX:+UseParNewGC:
指定在NewGeneration使用ParallelCollector，是UseParallelGC的gc的升级版本，有更好的性能或者优点，可以和CMSGC一起使用

* -XX:+CMSParallelRemarkEnabled:
在使用UseParNewGC的情况下，尽量减少mark的时间

* -XX:+UseConcMarkSweepGC:
指定在OldGeneration使用CMSGC，GCThread和APPThread并行(在init-mark和remark时PauseAPPThread)。apppause时间较短，适合交互性强的系统，如webserver

* -XX:+UseCMSCompactAtFullCollection:
在使用ConcurrentGC的情况下，防止MemoryFragmention，对LiveObject进行整理，使Memory碎片减少

* -XX:CMSFullGCsBeforeCompaction:
上面配置开启的情况下，这里设置多少次FullGC后，对年老代进行压缩

* -XX:CMSInitiatingOccupancyFraction:
指示在oldgeneration在使用了n%的比例后，启动ConcurrentCollector，默认值是68，如:-XX:CMSInitiatingOccupancyFraction=70
有个bug，在低版本(1.5.09andearly)的JVM上出现，http://bugs.sun.com/bugdatabase/view\_bug.do?bug\_id=6486089

* -XX:+UseCMSInitiatingOccupancyOnly
指示只有在OldGeneration在使用了初始化的比例后ConcurrentCollector启动收集

## 其他

* -XX:MaxDirectMemorySize:
指定本地直接内存大小，如果不指定，则默认与Java堆的最大值-Xmx指定一样。

* -XX:MaxTenuringThreshold:
指定一个Object在经历了n次YoungGC后转移到OldGeneration区，在Linux64的Java6下默认值是15，此参数对于throughputcollector无效，如:-XX:MaxTenuringThreshold=31

* -XX:+DisableExplicitGC:
禁止Java程序中的FullgGC，如System.gc()的调用.最好加上，防止程序在代码里误用了。对性能造成冲击。

* -XX:+UseFastAccessorMethods:
get，set方法转成本地代码

* -XX:+PrintGCDetails:
打应垃圾收集的情况如:[GC15610.466:[ParNew:229689K->20221K(235968K)，0.0194460secs]1159829K->953935K(2070976K)，0.0196420secs]

* -XX:+PrintGCTimeStamps:
打应垃圾收集的时间情况，如:[Times:user=0.09,sys=0.00，real=0.02secs]

* -XX:+PrintGCApplicationStoppedTime:
打应垃圾收集时，系统的停顿时间，如:Total-Time-For-Which-Application-Threads-Were-Stopped:0.0225920seconds

## 各种OOM/SOF程序

为了进一步理解这些参数，我将尝试写出各种OOM/SOF错误的程序，并附上步骤。

### Heap Out Of Memory

要使堆溢出非常简单，只要在程序中强引用许多对象例如字符串即可。

输入命令行:

```bash
javac HeapOOM.java
java -Xmx1m -Xms1m HeapOOM
```

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class HeapOOM {
    public static void main(String[] args) {
        List<String> strings = new ArrayList<>();
        System.out.println("doing....");
	    for(int i = 0;;i++) {
            strings.add(String.valueOf(i));
        }

    }
}
```

运行结果:

```bash
doing....
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
	at java.util.Arrays.copyOf(Arrays.java:3210)
	at java.util.Arrays.copyOf(Arrays.java:3181)
	at java.util.ArrayList.grow(ArrayList.java:261)
	at java.util.ArrayList.ensureExplicitCapacity(ArrayList.java:235)
	at java.util.ArrayList.ensureCapacityInternal(ArrayList.java:227)
	at java.util.ArrayList.add(ArrayList.java:458)
	at HeapOOM.main(HeapOOM.java:13)
```

### MethodArea Out Of Memory & ConstantPool Out Of Memory

由于运行时常量池是方法区的一部分，因此这两个区域的溢出测试就放在一起进行。

String.intern()是一个Native方法，它的作用是:如果字符串常量池中已经包含一个等于此String对象的字符串，则返回代表池中这个字符串的String对象；否则，将此String对象包含的字符串添加到常量池中，并且返回此String对象的引用。在JDK 1.6及之前的版本中，由于常量池分配在永久代内，我们可以通过-XX:PermSize和-XX:MaxPermSize限制方法区大小，从而间接限制其中常量池的容量。


```bash
javac MethodAreaOOM.java
java -XX:PermSize10m -XX:MaxPermSize10m MethodAreaOOM
```

不过这里要注意，Java8中虚拟机已将方法区移除，执行以上代码会得到如下信息:

```bash
java -XX:PermSize10m -XX:MaxPermSize10m MethodAreaOOM
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option PermSize10m; support was removed in 8.0
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize10m; support was removed in 8.0
```

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class MethodAreaOOM {

    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        int i = 0;
        for (;;) {
            list.add(String.valueOf(i++).intern());
        }
    }
}
```

输入命令行:

```bash
javac MethodAreaOOM.java
java -XX:PermSize10m -XX:MaxPermSize10m MethodAreaOOM
```

运行结果:

```bash
Exception in thread "main" java.lang.OutOfMemoryError: PermGen space
    at java.lang.String.intern(Native Method)
    at org.fenixsoft.oom.RuntimeConstantPoolOOM.main(MethodAreaOOM.java:18) 
```

从运行结果中可以看到，运行时常量池溢出，在OutOfMemoryError后面跟随的提示信息是“PermGen space”，说明运行时常量池属于方法区（HotSpot虚拟机中的永久代）的一部分。而使用JDK 1.7运行这段程序就不会得到相同的结果，while循环将一直进行下去。关于这个字符串常量池的实现问题，还可以引申出一个更有意思的影响。

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class StringTest {

    public static void main(String[] args) {
        String str1 = new StringBuilder("Programing").append("Language").toString();
        System.out.println(str1.intern() == str1);

        String str2 = new StringBuilder("ja").append("va").toString();
        System.out.println(str2.intern() == str2);
    }
}
```

这段代码在JDK 1.6中运行，会得到两个false，而在JDK 1.7中运行，会得到一个true和一个false。产生差异的原因是:**在JDK 1.6中，intern()方法会把首次遇到的字符串实例复制到永久代中**，返回的也是永久代中这个字符串实例的引用，而由StringBuilder创建的字符串实例在Java堆上，所以必然不是同一个引用，将返回false。**而JDK 1.7（以及部分其他虚拟机，例如JRockit）的intern()实现不会再复制实例，只是在常量池中记录首次出现的实例引用**，因此intern()返回的引用和由StringBuilder创建的那个字符串实例是同一个。对str2比较返回false是因为“java”这个字符串在执行StringBuilder.toString()之前已经出现过，字符串常量池中已经有它的引用了，不符合“首次出现”的原则，而“计算机软件”这个字符串则是首次出现的，因此返回true。

方法区用于存放Class的相关信息，如类名、访问修饰符、常量池、字段描述、方法描述等。对于这些区域的测试，基本的思路是运行时产生大量的类去填满方法区，直到溢出。

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class MethodAreaOOM {
    
    static class OOMObject {}
    
    public static void main(String[] args) {
        for (;;) {
            Enhancer enhancer = new Enhancer();
            enhancer.setSuperclass(OOMObject.class);
            enhancer.setUseCache(false);
            enhancer.setCallback(new MethodInterceptor() {
                public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
                    return proxy.invokeSuper(obj, args);
                }
            });
            enhancer.create();
        }
    }
}
```

输入命令行:

```bash
javac MethodAreaOOM.java
java -XX:PermSize10m -XX:MaxPermSize10m MethodAreaOOM
```

运行结果:

```bash
Caused by: java.lang.OutOfMemoryError: PermGen space
    at java.lang.ClassLoader.defineClass1(Native Method)
    at java.lang.ClassLoader.defineClassCond(ClassLoader.java:632)
    at java.lang.ClassLoader.defineClass(ClassLoader.java:616)
    ... 8 more
```

方法区溢出也是一种常见的内存溢出异常，一个类要被垃圾收集器回收掉，判定条件是比较苛刻的。在经常动态生成大量Class的应用中，需要特别注意类的回收状况。这类场景除了上面提到的程序使用了CGLib字节码增强和动态语言之外，常见的还有:大量JSP或动态产生JSP文件的应用（JSP第一次运行时需要编译为Java类）、基于OSGi的应用（即使是同一个类文件，被不同的加载器加载也会视为不同的类）等。在Java8中，由于绝大多数的类元数据的空间都从本地内存中分配，所以你再也看不到java.lang.OutOfMemoryError: PermGen error的异常了。


### DirectMemory Out Of Memory

DirectMemory容量可通过-XX:MaxDirectMemorySize指定，如果不指定，则默认与Java堆最大值（-Xmx指定）一样，下面的代码直接通过反射获取Unsafe实例进行内存分配（Unsafe类的getUnsafe()方法限制了只有引导类加载器才会返回实例，也就是设计者希望只有rt.jar中的类才能使用Unsafe的功能）。因为，虽然使用DirectByteBuffer分配内存也会抛出内存溢出异常，但它抛出异常时并没有真正向操作系统申请分配内存，而是通过计算得知内存无法分配，于是手动抛出异常，真正申请分配内存的方法是unsafe.allocateMemory()。

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class DirectMemoryOOM {

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) throws IllegalAccessException {

        /* Retrieve Unsafe */
        Field unsafeField = Unsafe.class.getDeclaredFields()[0];
        unsafeField.setAccessible(true);
        Unsafe unsafe = (Unsafe) unsafeField.get(null);

        for (;;) {
            unsafe.allocateMemory(_1MB);
        }
    }

}
```

输入命令行:

```bash
javac DirectMemoryOOM.java
java -XX:MaxDirectMemorySize=5m DirectMemoryOOM
```

运行结果:

```bash
Exception in thread "main" java.lang.OutOfMemoryError
    at sun.misc.Unsafe.allocateMemory(Native Method)
    at org.fenixsoft.oom.DMOOM.main(DMOOM.java:20) 
```
由DirectMemory导致的内存溢出，一个明显的特征是在Heap Dump文件中不会看见明显的异常，如果发现OOM之后Dump文件很小，而程序中又直接或间接使用了NIO，那就可以考虑检查一下是不是这方面的原因。

### Stack Overflow

在Java开发中，栈溢出是最常见的错误，一般是由于递归过深导致，如果出现这个错误绝大部分情况是由于无限递归引起的，仔细检查跳出递归条件即可避免。如果确实递归深度过深，出于效率考虑，可以改写成非递归形式，实在不行，更改-Xss参数即可。

```java
/**
 * Created by decaywood on 16-1-5.
 */
public class StackOverflow {
    private static void recurse() {
        recurse();
    }
    public static void main(String[] args) {
        recurse();
    }
}
```

输入命令行:

```bash
javac StackOverflow.java
java -Xss228k StackOverflow 
```

运行结果:

```java
Exception in thread "main" java.lang.StackOverflowError
	at StackOverflow.recurse(StackOverflow.java:13)
	at StackOverflow.recurse(StackOverflow.java:13)
	at StackOverflow.recurse(StackOverflow.java:13)
	at StackOverflow.recurse(StackOverflow.java:13)
        ...

```