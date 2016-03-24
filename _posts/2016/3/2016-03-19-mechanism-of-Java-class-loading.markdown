---
layout:     post
random-img: true
title:      Java类加载机制分析
subtitle:   The mechanism of Java class loading
date:       2016-03-19 15:07:49
author:     decaywood
description: Java类加载机制分析
keywords: 类加载,验证,初始化顺序
tags:
    - Java
    - JVM
---

## 类加载过程

类从被加载到虚拟机内存中开始，到卸载出内存为止，它的整个生命周期包括7个阶段：

* [加载（Loading）](#1)
* [验证（Verification）](#2)
* [准备（Preparation）](#3)
* [解析（Resolution）](#4)
* [初始化（Initialization）](#5)
* 使用（Using）
* 卸载（Unloading）

其中准备、验证、解析3个部分统称为连接（Linking）。

加载、验证、准备、初始化和卸载这5个阶段的顺序是确定的，类的加载过程必须按照这种顺序按部就班地开始，而解析阶段则不一定：它在某些情况下可以在初始化阶段之后再开始，这是为了支持Java语言的运行时绑定（也称为动态绑定或晚期绑定）。以下陈述的内容都已HotSpot为基准。

<h2 id="1">加载</h2>

在加载阶段（可以参考java.lang.ClassLoader的loadClass()方法），虚拟机需要完成以下3件事情：

* 通过一个类的全限定名来获取定义此类的二进制字节流（并没有指明要从一个Class文件中获取，可以从其他渠道，譬如：网络、动态生成、数据库等）
* 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构
* 在内存中生成一个代表这个类的java.lang.Class对象，作为方法区这个类的各种数据的访问入口

加载阶段和连接阶段（Linking）的部分内容（如一部分字节码文件格式验证动作）是交叉进行的，加载阶段尚未完成，连接阶段可能已经开始，但这些夹在加载阶段之中进行的动作，仍然属于连接阶段的内容，这两个阶段的开始时间仍然保持着固定的先后顺序。

<h2 id="2">验证</h2>

验证是连接阶段的第一步，这一阶段的目的是为了确保Class文件的字节流中包含的信息符合当前虚拟机的要求，并且不会危害虚拟机自身的安全。验证阶段大致会完成4个阶段的检验动作：

* 文件格式验证：验证字节流是否符合Class文件格式的规范；例如：是否以魔数0xCAFEBABE开头、主次版本号是否在当前虚拟机的处理范围之内、常量池中的常量是否有不被支持的类型
* 元数据验证：对字节码描述的信息进行语义分析（注意：对比javac编译阶段的语义分析），以保证其描述的信息符合Java语言规范的要求；例如：除了java.lang.Object之外，这个类是否有父类
* 字节码验证：通过数据流和控制流分析，确定程序语义是合法的、符合逻辑的
* 符号引用验证：确保解析动作能正确执行

验证阶段是非常重要的，但不是必须的，它对程序运行期没有影响，如果所引用的类经过反复验证，那么可以考虑采用-Xverifynone参数来关闭大部分的类验证措施，以缩短虚拟机类加载的时间。

<h2 id="3">准备</h2>

准备阶段是正式为类变量分配内存并设置类变量初始值的阶段，这些变量所使用的内存都将在方法区中进行分配。这时候进行内存分配的仅包括类变量（被static修饰的变量），而不包括实例变量，实例变量将会在对象实例化时随着对象一起分配在堆中。其次，这里所说的初始值“通常情况”下是数据类型的零值，假设类变量的定义为如下：

```
public static String value = "decaywood";
```

那变量value在准备阶段过后的初始值为null而不是"decaywood"。因为这时候尚未开始执行任何java方法，而把value赋值为"decaywood"的putstatic指令是程序被编译后，存放于类构造器方法之中，所以把value赋值为"decaywood"的动作将在初始化阶段才会执行。
至于“特殊情况”是指：

```
public static final String value = "decaywood"
```

即当类字段的字段属性是ConstantValue时，会在准备阶段初始化为指定的值，所以标注为final之后，value的值在准备阶段初始化为"decaywood"而非null。

<h2 id="4">解析</h2>

解析阶段是虚拟机将常量池内的符号引用替换为直接引用的过程。解析动作主要针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用点限定符7类符号引用进行。

<h2 id="5">初始化</h2>

类初始化阶段是类加载过程的最后一步，到了初始化阶段，才真正开始执行类中定义的java程序代码。在准备阶段，变量已经付过一次系统要求的初始值，而在初始化阶段，则根据代码指定值来初始化类变量和其他资源，或者说：初始化阶段是执行类构造器\<clinit\>()方法的过程。

\<clinit\>()方法是由编译器自动收集类中的所有类变量的赋值动作和静态语句块static\{\}中的语句合并产生的，编译器收集的顺序是由语句在源文件中出现的顺序所决定的，静态语句块只能访问到定义在静态语句块之前的变量，定义在它之后的变量，在前面的静态语句块可以赋值，但是不能访问。如下：

```java

/**
 * @author: decaywood
 * @date: 2016/03/19 12:24
 */
public class LoadingOrderTest {
    static {
        value = "init";
        System.out.println(value); // Illegal forward reference
    }
    static String value = "decaywood";
}

```

\<clinit\>()方法与实例构造器\<init\>()方法不同，它不需要显示地调用父类构造器，虚拟机会保证在子类\<clinit\>()方法执行之前，父类的\<clinit\>()方法方法已经执行完毕。由于父类的\<clinit\>()方法先执行，也就意味着父类中定义的静态语句块要优先于子类的变量赋值操作。

\<clinit\>()方法对于类或者接口来说并不是必需的，如果一个类中没有静态语句块，也没有对变量的赋值操作，那么编译器可以不为这个类生产\<clinit\>()方法。

接口中不能使用静态语句块，但仍然有变量初始化的赋值操作，因此接口与类一样都会生成\<clinit\>()方法。但接口与类不同的是，执行接口的\<clinit\>()方法不需要先执行父接口的\<clinit\>()方法。只有当父接口中定义的变量使用时，父接口才会初始化。另外，接口的实现类在初始化时也一样不会执行接口的\<clinit\>()方法。
虚拟机会保证一个类的\<clinit\>()方法在多线程环境中被正确的加锁、同步，如果多个线程同时去初始化一个类，那么只会有一个线程去执行这个类的\<clinit\>()方法，其他线程都需要阻塞等待，直到活动线程执行\<clinit\>()方法完毕。如果在一个类的\<clinit\>()方法中有好事很长的操作，就可能造成多个线程阻塞，在实际应用中这种阻塞往往是隐藏的。

```java
/**
 * @author: decaywood
 * @date: 2016/03/19 13:10
 */
public class DeadBlock {

    public static class DeadBlockClass {
        static {
            System.out.println(Thread.currentThread() + "class static start");

            try {
                Thread.sleep(1000000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            System.out.println(Thread.currentThread() + "class static over");
        }
    }
    public static void main(String[] args)
    {
        Runnable script = () -> {
            System.out.println(Thread.currentThread()+"thread start");
            new DeadBlockClass();
            System.out.println(Thread.currentThread()+"thread run over");
        };

        Thread thread1 = new Thread(script);
        Thread thread2 = new Thread(script);
        thread1.start();
        thread2.start();
    }
}
```
运行结果：（即一条线程在长时间操作，另一条线程在阻塞等待）

```java
Thread[Thread-1,5,main]thread start
Thread[Thread-0,5,main]thread start
Thread[Thread-1,5,main]class static start
```

需要注意的是，其他线程虽然会被阻塞，但如果执行\<clinit\>()方法的那条线程退出\<clinit\>()方法后，其他线程唤醒之后不会再次进入\<clinit\>()方法。同一个类加载器下，一个类型只会初始化一次。将上面代码中的静态块替换如下：

```java
static {
        System.out.println(Thread.currentThread() + "class static start");

        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println(Thread.currentThread() + "class static over");
}
```

运行结果：

```java
Thread[Thread-0,5,main]thread start
Thread[Thread-1,5,main]thread start
Thread[Thread-0,5,main]class static start
Thread[Thread-0,5,main]class static over
Thread[Thread-0,5,main]thread run over
Thread[Thread-1,5,main]thread run over
```
虚拟机规范严格规定了有且只有5中情况必须对类进行“初始化”（而加载、验证、准备自然需要在此之前开始）：

遇到```new```,```getstatic```,```putstatic```,```invokestatic```这四个字节码指令时，如果类没有进行过初始化，则需要先触发其初始化。生成这4条指令的最常见的Java代码场景是：

* 使用new关键字实例化对象的时候、读取或设置一个类的静态字段（被final修饰、已在编译器把结果放入常量池的静态字段除外）的时候，以及调用一个类的静态方法的时候。
* 使用java.lang.reflect包的方法对类进行反射调用的时候，如果类没有进行过初始化，则需要先触发其初始化。
* 当初始化一个类的时候，如果发现其父类还没有进行过初始化，则需要先触发其父类的初始化。
* 当虚拟机启动时，用户需要指定一个要执行的主类（包含main()方法的那个类），虚拟机会先初始化这个主类。
* 当使用jdk1.7动态语言支持时，如果一个java.lang.invoke.MethodHandle实例最后的解析结果包含REF_getstatic,REF_putstatic,REF_invokeStatic的方法句柄，并且这个方法句柄所对应的类没有进行初始化，则需要先出触发其初始化。

以下场景不会引起初始化：

* 通过子类引用父类的静态字段，不会导致子类初始化
* 通过数组定义来引用类，不会触发此类的初始化
* 常量在编译阶段会存入调用类的常量池中，本质上并没有直接引用到定义常量的类，因此不会触发定义常量的类的初始化

## 经典的例子

这个例子在stackoverflow上多次出现过，基本能把Java类加载顺序展现出来。

```java
/**
 * @author: decaywood
 * @date: 2016/03/19 14:31
 */
public class LoadOrder {

    public static void main(String[] args)
    {
        staticFunction();
    }

    static LoadOrder loadOrder = new LoadOrder();

    static
    {
        System.out.println("static init block");
    }

    {
        System.out.println("instance init block");
    }

    LoadOrder()
    {
        System.out.println("init constructor");
        System.out.println("instanceVal = " + instanceVal + ", staticVal = " +staticVal);
    }

    public static void staticFunction(){
        System.out.println("static function");
    }

    int instanceVal = 123;
    static int staticVal = 321;
}
```
运行结果：

```java
instance init block
init constructor
instanceVal = 123, staticVal = 0
static init block
static function
```

具体分析过程就不细说了，可以通过这个例子好好回顾一下Java的类初始化顺序。包括我在内，很多人第一次解答时都错得离谱，不过话说回来，在不断试错中学习，印象也是最深刻的。

参考：《深入理解java虚拟机》
