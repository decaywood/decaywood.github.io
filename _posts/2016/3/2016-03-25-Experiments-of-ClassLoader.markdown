---
layout:     post
random-img: true
title:      一些与JVM类加载器有关的实验
subtitle:   Some laboratory experiments of JVM ClassLoader
date:       2016-03-25 10:25:51
author:     decaywood
description: 每个java开发人员对java.lang.ClassNotFoundExcetpion这个异常肯定都不陌生，这背后就涉及到了java技术体系中的类加载。Java的类加载机制是java技术体系中比较核心的部分，虽然和大部分开发人员直接打交道不多，但是对其背后的机理有一定理解有助于排查程序中出现的类加载失败等技术问题，对理解java虚拟机的连接模型和java语言的动态性都有很大帮助。
keywords: Java类加载,类加载器,双亲委派机制,自定义类加载器
tags:
    - Java
    - JVM
---

<b id="toc">目录</b>

## Java虚拟机类加载器结构

### JVM内置的三个基础类加载器

我们首先看一下JVM预定义的三种类型类加载器，当一个JVM启动的时候，Java缺省开始使用如下三种类型类装入器：

* 启动类加载器（BootstrapClassLoader）：启动类加载器是用本地代码实现的类加载器，它负责将$JAVA\_HOME/lib下面的核心类库或-Xbootclasspath选项指定的jar包加载到内存中。由于引导类加载器涉及到虚拟机本地实现细节，开发者无法直接获取到启动类加载器的引用，所以不允许直接通过引用进行操作。
* 扩展类加载器（ExtClassLoader）：扩展类加载器是由Sun的ExtClassLoader（sun.misc.Launcher$ExtClassLoader）实现的。它负责将$JAVA\_HOME/lib/ext或者由系统变量-Djava.ext.dir指定位置中的类库加载到内存中。开发者可以直接使用扩展类加载器。
* 系统类加载器（AppClassLoader）：系统类加载器是由 Sun的 AppClassLoader（sun.misc.Launcher$AppClassLoader）实现的。它负责将系统类路径java -classpath或-Djava.class.path变量所指的目录下的类库加载到内存中。开发者可以直接使用系统类加载器。

除了以上列举的三种类加载器，还有一种比较特殊的类型就是线程上下文类加载器，这个将在后面单独介绍。

### 类加载器的继承结构图

<img src="{{site.cdnurl}}/img/post/2016/ClassLoader-inheritance-structure.svg" alt="SVG" style="background-color:white">

### 类加载双亲委派机制介绍和分析

在这里，需要着重说明的是，JVM在加载类时默认采用的是双亲委派机制。通俗的讲，就是某个特定的类加载器在接到加载类的请求时，首先将加载任务委托给父类加载器，依次递归，如果父类加载器可以完成类加载任务，就成功返回；只有父类加载器无法完成此加载任务时，才自己去加载。关于虚拟机默认的双亲委派机制，我们可以从系统类加载器和扩展类加载器为例作简单分析。

```java
public abstract class ClassLoader {
    /**
     * 加载指定名称（包括包名）的二进制类型，供用户调用的接口
     * 下文详细分析其作用
     * 此方法有两个重载版本
     */
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException{
        ...
    }
    
    /**
     * 此方法一般由loadClass调用，用于子类进行继承以实现特定的class查找策略
     * 默认抛出ClassNotFound异常
     */
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        throw new ClassNotFoundException(name);
    }
    
    /**
     * 用于定义类型，一般在findClass方法中读取到对应字节码后调用，可以看出不可继承
     * 说明：JVM已经实现了对应的具体功能，解析对应的字节码，产生对应的内部数据结构放置到方法区，
     * 所以无需覆写，直接调用就可以了
     * 此方法有多个重载版本
     */
    protected final Class<?> defineClass(String name, byte[] b, int off, int len, ProtectionDomain protectionDomain) throws ClassFormatError {
        ...
    }
}
  
```

### 双亲委派机制的代码逻辑

通过进一步分析扩展类加载器（ExtClassLoader）和系统类加载器（AppClassLoader）的代码以及其公共父类（SecureClassLoader）的代码可以看出，都没有覆写ClassLoader中默认的加载规则loadClass(String name)方法。既然这样，我们就可以通过ClassLoader中的loadClass(String name)方法对虚拟机默认采用的双亲委派机制进行分析：

```java
public abstract class ClassLoader {

    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    
        synchronized (getClassLoadingLock(name)) {
            // First, check if the class has already been loaded
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                long t0 = System.nanoTime();
                try {
                    if (parent != null) {
                        c = parent.loadClass(name, false);
                    } else {
                        c = findBootstrapClassOrNull(name);
                    }
                } catch (ClassNotFoundException e) {
                    // ClassNotFoundException thrown if class not found
                    // from the non-null parent class loader
                }

                if (c == null) {
                    // If still not found, then invoke findClass in order
                    // to find the class.
                    long t1 = System.nanoTime();
                    c = findClass(name);

                    // this is the defining class loader; record the stats
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                    sun.misc.PerfCounter.getFindClasses().increment();
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
}
```

从源码可以看出，loadclass(String, boolean)的基本逻辑如下：
 
 * step1：检查指定class是否已经被加载
 * step2：若class未被加载，则尝试通过父加载器加载class，若父类为null，则使用启动类加载器加载该类
 * step3：若父类加载器未能加载class，则通过当前类加载器的findClass(String)方法加载该类
 * step4：若class最终被加载，且resolve为true，则对该class进行连接操作
 
### 类加载器之间的关系

<img src="{{site.cdnurl}}/img/post/2016/Relationships-of-Classloader.svg" alt="SVG" style="background-color:white">

上面图片给人的直观印象是系统类加载器的父类加载器是扩展类加载器，扩展类加载器的父类加载器是启动类加载器，下面我们就用代码具体测试一下：

```java
/**
 * @author: decaywood
 * @date: 2016/03/20 15:56
 */
public class ClassLoaderInheritance {

    public static void main(String[] args) {
        try {
            System.out.println(ClassLoader.getSystemClassLoader());
            System.out.println(ClassLoader.getSystemClassLoader().getParent());
            System.out.println(ClassLoader.getSystemClassLoader().getParent().getParent());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
```

说明：通过java.lang.ClassLoader.getSystemClassLoader()可以直接获取到系统类加载器。

运行结果：

```java
sun.misc.Launcher$AppClassLoader@2503dbd3
sun.misc.Launcher$ExtClassLoader@511d50c0
null
```

通过以上的代码输出，我们可以判定系统类加载器的父加载器是扩展类加载器，但是我们试图获取扩展类加载器的父类加载器时确得到了null，就是说扩展类加载器本身强制设定父类加载器为null。我们还是借助于代码分析一下。我们首先看一下java.lang.ClassLoader抽象类中默认实现的两个构造函数：

```java
public abstract class ClassLoader {

    // The parent class loader for delegation
    // Note: VM hardcoded the offset of this field, thus all new fields
    // must be added *after* it.
    private final ClassLoader parent;
    
   
    protected ClassLoader(ClassLoader parent) {
        this(checkCreateClassLoader(), parent);
    }
 
    protected ClassLoader() {
        this(checkCreateClassLoader(), getSystemClassLoader());
    }

    private ClassLoader(Void unused, ClassLoader parent) {
        this.parent = parent;
        ...
    }
}
```

声明为私有变量的同时并没有对外提供可供派生类访问的public或者protected设置器接口（对应的setter方法），结合前面的测试代码的输出，我们可以推断出：

* 系统类加载器（AppClassLoader）调用ClassLoader带参构造函数将父类加载器设置为扩展类加载器(ExtClassLoader)。（因为如果不强制设置，默认会通过调用getSystemClassLoader()方法获取并设置成系统类加载器，这显然和测试输出结果不符。）

* 扩展类加载器（ExtClassLoader）调用ClassLoader带参构造函数将父类加载器设置为null。（因为如果不强制设置，默认会通过调用getSystemClassLoader()方法获取并设置成系统类加载器，这显然和测试输出结果不符。）

现在我们可能会有这样的疑问：扩展类加载器（ExtClassLoader）的父类加载器被强制设置为null了，那么扩展类加载器为什么还能将加载任务委派给启动类加载器呢？

通过分析源码可以发现，扩展类加载器和系统类加载器及其父类（URLClassLoader和SecureClassLoader）都没有覆写ClassLoader中默认的加载委派规则loadClass(...)方法。有关ClassLoader中默认的加载委派规则前面已经分析过，如果父加载器为null，则会调用本地方法进行启动类加载尝试。所以，前面展示的类加载器关系图中，启动类加载器、扩展类加载器和系统类加载器之间的委派关系事实上是成立的。

### 双亲委派的实例证明

```java
/**
 * @author: decaywood
 * @date: 2016/03/20 19:24
 * 用于加载的目标类
 */
public class ClassLoaderTest {}
```

```bash
echo $JAVA_HOME -> /Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home
```

#### 测试一

在ClassLoaderProject工程里面添加如下程序：

```java
/**
 * @author: decaywood
 * @date: 2016/03/20 19:22
 */
public class ClassLoaderInheritance2 {

    public static void main(String[] args) {
        try {
            //查看当前系统类路径中包含的路径条目
            String paths = System.getProperty("java.class.path");
            for (String path : paths.split(":")) {
                System.out.println(path);
            }
            System.out.println("--------------");
            //调用加载当前类的类加载器（这里即为系统类加载器）加载TestBean
            Class clazz = Class.forName("org.decaywood.test.ClassLoaderTest");
            //查看被加载的TestBean类型是被那个类加载器加载的
            System.out.println(clazz.getClassLoader());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
```

运行结果如下：

```java
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/charsets.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/deploy.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/cldrdata.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/dnsns.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/jaccess.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/jfxrt.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/localedata.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/nashorn.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/sunec.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/sunjce_provider.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/sunpkcs11.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext/zipfs.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/javaws.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/jce.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/jfr.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/jfxswt.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/jsse.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/management-agent.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/plugin.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/resources.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/rt.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/ant-javafx.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/dt.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/javafx-mx.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/jconsole.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/packager.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/sa-jdi.jar
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/lib/tools.jar
/Users/decaywood/IdeaProjects/ClassLoaderProject/out/production/ClassLoaderProject
/Applications/IntelliJ IDEA 15.app/Contents/lib/idea_rt.jar
--------------
sun.misc.Launcher$AppClassLoader@2503db
```

说明：当前类路径默认的含有的条目除了系统类加载器本身能加载的库外（包含$JAVA\_HOME/lib中的核心库以及$JAVA\_HOME/lib/ext中的库）就是工程的输出目录。

#### 测试二

将当前工程输出目录下的ClassLoaderTest.class打包进test.jar剪贴到$JAVA\_HOME/jre/lib/ext目录下（现在工程输出目录下和JRE扩展目录下都有待加载类型的class文件）：

```bash
decaywood-mac:src decaywood$ jar -cvf test.jar org/ 
decaywood-mac:src decaywood$ sudo mv test.jar $JAVA_HOME/jre/lib/ext
```

测试一中的ClassLoaderInheritance2文件一行改为如下：

```java
String paths = System.getProperty("java.class.path");
改为
String paths = System.getProperty("java.ext.dirs");
```

运行基于测试一的修改过的测试代码，结果如下：

```java
/Users/decaywood/Library/Java/Extensions
/Library/Java/JavaVirtualMachines/jdk1.8.0_71.jdk/Contents/Home/jre/lib/ext
/Library/Java/Extensions
/Network/Library/Java/Extensions
/System/Library/Java/Extensions
/usr/lib/java
--------------
sun.misc.Launcher$ExtClassLoader@63947c6
```

对比测试一和测试二的运行结果，我们明显可以验证前面说的双亲委派机制，系统类加载器在接到加载org.decaywood.test.ClassLoaderTest类型的请求时，首先将请求委派给父类加载器（扩展类加载器），扩展类加载器抢先完成了加载请求。

#### 测试三

将测试二生成的test.jar剪贴到$JAVA\_HOME/lib目录下：

```bash
decaywood-mac:src decaywood$ sudo mv test.jar $JAVA_HOME/lib
```

运行结果如下：

```java
...
--------------
sun.misc.Launcher$ExtClassLoader@63947c6
```
测试三和测试二输出结果一致。那就是说，放置到$JAVA\_HOME/lib目录下的ClassLoaderTest对应的class字节码并没有被加载，这其实和前面讲的双亲委派机制并不矛盾。虚拟机出于安全等因素考虑，不会加载$JAVA\_HOME/lib存在的陌生类，开发者通过将要加载的非JDK自身的类放置到此目录下期待启动类加载器加载是不可能的。做个进一步验证，删除$JAVA\_HOME/jre/lib/ext目录下和工程输出目录下的ClassLoaderTest对应的class文件，然后再运行测试代码，则将会有ClassNotFoundException异常抛出。有关这个问题，大家可以在java.lang.ClassLoader中的loadClass(String name, boolean resolve)方法中设置相应断点运行测试三进行调试，会发现findBootstrapClass0()会抛出异常，然后在下面的findClass方法中被加载，当前运行的类加载器正是扩展类加载器（sun.misc.Launcher$ExtClassLoader），这一点可以通过JDT中变量视图查看验证。

## java程序动态扩展方式

Java的连接模型允许用户运行时扩展引用程序，既可以通过当前虚拟机中预定义的加载器加载编译时已知的类或者接口，又允许用户自行定义类装载器，在运行时动态扩展用户的程序。通过用户自定义的类装载器，你的程序可以装载在编译时并不知道或者尚未存在的类或者接口，并动态连接它们并进行有选择的解析。运行时动态扩展java应用程序有如下两个途径：

* 调用Class.forName(…)加载类
* 用户自定义类加载器

### 调用Class.forName(...)

此方法一共有两个重载版本：

```java

public final class Class<T> implements java.io.Serializable, GenericDeclaration, Type, AnnotatedElement {
                              
    public static Class<?> forName(String className)
                throws ClassNotFoundException {
        ...
    }
    
    public static Class<?> forName(String name, boolean initialize,
                                   ClassLoader loader)
                throws ClassNotFoundException {
        ...
    }
                                  
}

```

这里的initialize参数是很重要的。它表示在加载同时是否完成初始化的工作（说明：单参数版本的forName方法默认是完成初始化的）。有些场景下需要将initialize设置为true来强制加载同时完成初始化。loader参数可以指定加载类的类加载器。

### 用户自定义类加载器

通过前面的分析，我们可以看出，除了和本地实现密切相关的启动类加载器之外，包括标准扩展类加载器和系统类加载器在内的所有其他类加载器我们都可以当做自定义类加载器来对待，唯一区别是是否被虚拟机默认使用。前面的内容中已经对ClassLoader抽象类中的几个重要的方法做了介绍，这里简要叙述一下一般用户自定义类加载器的工作流程：

* 首先检查请求的类型是否已经被这个类装载器装载到命名空间中了，如果已经装载，直接返回；否则转入下一个步骤
* 委派类加载请求给父类加载器（更准确的说应该是双亲类加载器，真实虚拟机中各种类加载器最终会呈现树状结构），如果父类加载器能够完成，则返回父类加载器加载的Class实例；否则转入下一个步骤
* 调用本类加载器的findClass(...)方法，试图获取对应的字节码，如果获取的到，则调用defineClass(...)导入类型到方法区；如果获取不到对应的字节码或者其他原因失败，返回异常给loadClass(...)， loadClass(...)转而抛异常，终止加载过程（注意：这里的异常种类不止一种）。

## 一些疑问以及证明

### JVM的命名空间

在Java中，一个类用其完全匹配类名(fully qualified class name)作为标识，这里指的完全匹配类名包括包名和类名。但在JVM中一个类用其全名和一个加载类ClassLoader的实例作为唯一标识，不同类加载器加载的类将被置于不同的命名空间。我们可以用两个自定义类加载器去加载某自定义类型（注意不要将自定义类型的字节码放置到系统路径或者扩展路径中，否则会被系统类加载器或扩展类加载器抢先加载），然后用获取到的两个Class实例进行“==”判断，将会得到不相等的结果。

* step1：新建测试类

```java
package org.decaywood.test;
/**
 * @author: decaywood
 * @date: 2016/03/25 00:05
 */
public class SayHello {

    public void invokeMe() {
        System.out.println("hello world!");
    }

}
```
* step2：新建测试用ClassLoader

```java
package org.decaywood.test;

import java.io.File;
import java.io.FileInputStream;

/**
 * @author: decaywood
 * @date: 2016/03/24 22:54
 * 
 * 一般来说，自己开发的类加载器只需要覆写findClass(String name)方法即可。
 * ClassLoader类的方法loadClass()封装了前面提到的代理模式的实现。
 * 该方法会首先调用findLoadedClass()方法来检查该类是否已经被加载过；
 * 如果没有加载过的话，会调用父类加载器的loadClass()方法来尝试加载该类；
 * 如果父类加载器无法加载该类的话，就调用findClass()方法来查找该类。
 * 因此，为了保证类加载器都正确实现代理模式，在开发自己的类加载器时，
 * 最好不要覆写 loadClass()方法，而是覆写 findClass()方法。
 */
public class TestClassLoader extends ClassLoader {

    private String clPath;
    public TestClassLoader(String clPath) {
        this.clPath = clPath;
    }
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        String clp = "/Users/decaywood/".concat(this.clPath);
        String packagePath = "/org/decaywood/test/";
        String filePath = clp.concat(packagePath).concat("SayHello.class");
        File file = new File(filePath);
        try (FileInputStream fi = new FileInputStream(file)) {
            int fileLen = fi.available();
            byte[] buffer = new byte[fileLen];
            int len = fi.read(buffer);
            assert len == fileLen;
            return defineClass(name, buffer, 0, fileLen);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

* step3：将SayHello编译为.class文件分别放入不同的类加载路径中
  * /Users/decaywood/cla/org/decaywood/test
  * /Users/decaywood/clb/org/decaywood/test
* step4: 删除工程内的SayHello.java源文件，以免被系统类加载器抢先加载。
* step5：执行以下代码（如果编译器没有开启断言的话，给编译器加上-ea参数）：

```java
package org.decaywood.test;

import java.lang.reflect.Method;

/**
 * @author: decaywood
 * @date: 2016/03/25 00:52
 */
public class LoadingTest {

    public static void main(String[] args) throws Exception {
        String nameSpace = "org.decaywood.test.SayHello";
        TestClassLoader classLoaderA = new TestClassLoader("cla/");
        TestClassLoader classLoaderB = new TestClassLoader("clb/");
        Class<?> sayHelloA = classLoaderA.loadClass(nameSpace);
        Class<?> sayHelloB = classLoaderB.loadClass(nameSpace);
        assert sayHelloA != sayHelloB;
        Method methodA = sayHelloA.getMethod("invokeMe");
        Method methodB = sayHelloB.getMethod("invokeMe");
        methodA.invoke(sayHelloA.newInstance());
        methodB.invoke(sayHelloB.newInstance());
        System.out.println("end without error!");
    }

}

```

运行结果：

```
hello world!
hello world!
end without error!
```

在前面介绍类加载器的代理委派模式的时候，提到过类加载器会首先代理给其它类加载器来尝试加载某个类。这就意味着真正完成类的加载工作的类加载器和启动这个加载过程的类加载器，有可能不是同一个。真正完成类的加载工作是通过调用defineClass来实现的；而启动类的加载过程是通过调用loadClass来实现的。前者称为一个类的定义加载器（defining loader），后者称为初始加载器（initiating loader）。在Java虚拟机判断两个类是否相同的时候，使用的是类的定义加载器。也就是说，哪个类加载器启动类的加载过程并不重要，重要的是最终定义这个类的加载器。两种类加载器的关联之处在于：一个类的定义加载器是它引用的其它类的初始加载器。如类 com.example.Outer引用了类 com.example.Inner，则由类 com.example.Outer的定义加载器负责启动类 com.example.Inner的加载过程。

方法loadClass()抛出的是ClassNotFoundException异常；方法defineClass()抛出的是 NoClassDefFoundError异常。类加载器在成功加载某个类之后，会把得到的Class类的实例缓存起来。下次再请求加载该类的时候，类加载器会直接使用缓存的类的实例，而不会尝试再次加载。也就是说，对于一个类加载器实例来说，相同全名的类只加载一次，即 loadClass方法不会被重复调用。

在绝大多数情况下，系统默认提供的类加载器实现已经可以满足需求。但是在某些情况下，您还是需要为应用开发出自己的类加载器。比如您的应用通过网络来传输Java类的字节代码，为了保证安全性，这些字节代码经过了加密处理。这个时候您就需要自己的类加载器来从某个网络地址上读取加密后的字节代码，接着进行解密和验证，最后定义出要在Java虚拟机中运行的类来。

通过网络加载的类，一般有两种做法来使用它。第一种做法是使用Java反射API。另外一种做法是使用接口。需要注意的是，并不能直接在客户端代码中引用从服务器上下载的类，因为客户端代码的类加载器找不到这些类。使用Java反射API可以直接调用Java类的方法。而使用接口的做法则是把接口的类放在客户端中，从服务器上加载实现此接口的不同版本的类。

网络类加载器同上面的TestClassLoader大同小异，IO方式不同而已，在这就不再赘述了。

### 未设定父类加载器会如何？

在不指定父类加载器的情况下，默认采用系统类加载器。

```java
public abstract class ClassLoader {

    private ClassLoader(Void unused, ClassLoader parent) {
        this.parent = parent;
        ...
    }
    
    protected ClassLoader(ClassLoader parent) {
        this(checkCreateClassLoader(), parent);
    }
    
    protected ClassLoader() {
        this(checkCreateClassLoader(), getSystemClassLoader());
    }

}
```

所以，我们现在可以相信当自定义类加载器没有指定父类加载器的情况下，默认的父类加载器即为系统类加载器。同时，我们可以得出如下结论：即使用户自定义类加载器不指定父类加载器，那么，同样可以加载如下三个地方的类：

* $JAVA\_HOME/lib下的类；
* $JAVA\_HOME/lib/ext下或者由系统变量java.ext.dir指定位置中的类；
* 当前工程类路径下或者由系统变量java.class.path指定位置中的类。

### 强制父类加载器为空会如何？

JVM规范中规定如果用户自定义的类加载器将父类加载器强制设置为null，那么会自动将启动类加载器设置为当前用户自定义类加载器的父类加载器（这个问题前面已经分析过了）。同时，我们可以得出如下结论：

即使用户自定义类加载器不指定父类加载器，那么，同样可以加载到\<Java\_Runtime\_Home\>/lib下的类，但此时就不能够加载\<Java\_Runtime\_Home\>/lib/ext目录下的类了。需要说明：以上两个问题的推断结论是基于用户自定义的类加载器本身延续了ClassLoader.loadClass(...)的默认委派逻辑，如果用户对这一默认委派逻辑进行了改变，以上推断结论就不一定成立了。
