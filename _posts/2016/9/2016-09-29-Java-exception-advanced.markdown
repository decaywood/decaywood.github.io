---
layout:     post
random-img: true
title:      Java异常进阶
subtitle:   Java Exception Advanced
date:       2016-09-29 13:27:14
author:     decaywood
description: 介绍了一些处理异常的方式
keywords: Java,Exception
tags:
    - Java
---

在使用Java编写应用的时候，我们常常需要通过第三方类库来帮助我们完成所需要的功能。有时候这些类库所提供的很多API都通过throws声明了它们所可能抛出的异常。但是在查看这些API的文档时，我们却没有办法找到有关这些异常的详尽解释。在这种情况下，我们不能简单地忽略这些由throws所声明的异常：

```java
public void shouldNotThrowCheckedException() {
    // 该API调用可能抛出一个不明原因的Checked Exception
    exceptionalAPI();
}
```
否则Java编译器会由于shouldNotThrowCheckedException()函数没有声明其可能抛出的Checked Exception而报错。但是如果通过throws标明了该函数所可能抛出的Checked Exception，那么其它对shouldNotThrowCheckedException()函数的调用同样需要通过throws标明其可能抛出该Checked Exception。

那我们应该如何对这些Checked Exception进行处理呢？在本文中，我们将对如何在Java应用中使用及处理Checked Exception进行简单地介绍。

**Java异常简介**

在详细介绍Checked Exception所导致的问题之前，我们先用一小段篇幅简单介绍一下Java中的异常。

在Java中，异常主要分为三种：Exception，RuntimeException以及Error。这三类异常都是Throwable的子类。直接从Exception派生的各个异常类型就是我们刚刚提到的Checked Exception。它的一个比较特殊的地方就是强制调用方对该异常进行处理。就以我们常见的用于读取一个文件内容的FileReader类为例。在该类的构造函数声明中声明了其可能会抛出FileNotFoundException：

```java
public FileReader(String fileName) throws FileNotFoundException {
    ……
}
```
那么在调用该构造函数的函数中，我们需要通过try…catch…来处理该异常：

```java
public void processFile() {
    try {
        FileReader fileReader = new FileReader(inFile);
    } catch(FileNotFoundException exception) {
        // 异常处理逻辑
    }
    ……
}
```
如果我们不通过try…catch…来处理该异常，那么我们就不得不在函数声明中通过throws标明该函数会抛出FileNotFoundException：

```java
public void processFile() throws FileNotFoundException {
    FileReader fileReader = new FileReader(inFile); // 可能抛出FileNotFoundException
    ……
}
```
而RuntimeException类的各个派生类则没有这种强制调用方对异常进行处理的需求。为什么这两种异常会有如此大的区别呢？因为RuntimeException所表示的是软件开发人员没有正确地编写代码所导致的问题，如数组访问越界等。而派生自Exception类的各个异常所表示的并不是代码本身的不足所导致的非正常状态，而是一系列应用本身也无法控制的情况。例如一个应用在尝试打开一个文件并写入的时候，该文件已经被另外一个应用打开从而无法写入。对于这些情况，Java通过Checked Exception来强制软件开发人员在编写代码的时候就考虑对这些无法避免的情况的处理，从而提高代码质量。

而Error则是一系列很难通过程序解决的问题。这些问题基本上是无法恢复的，例如内存空间不足等。在这种情况下，我们基本无法使得程序重新回到正常轨道上。因此一般情况下，我们不会对从Error类派生的各个异常进行处理。而且由于其实际上与本文无关，因此我们不再对其进行详细讲解。

**天使变恶魔**

既然Java中的Checked Exception能够提高用户代码质量，为什么还有那么多人反对它呢？原因很简单：它太容易被误用了。而在本节中，我们就将列出这些误用情况并提出相应的网络上最为推荐的解决方案。

**无处不在的throws**

第一种误用的情况就是Checked Exception的广泛传播。在前面已经提到过，调用一个可能抛出Checked Exception的API时，软件开发人员可以有两种选择。其中一种选择就是在对该API进行调用的函数上添加throws声明，并将该Checked Exception向上传递：

```java
public void processFile() throws FileNotFoundException {
    FileReader fileReader = new FileReader(inFile); // 可能抛出FileNotFoundException
    ……
}
```

而在调用processFile()函数的代码中，软件开发人员可能觉得这里还不是处理异常FileNotFoundException的合适地点，因此他通过throws将该异常再次向上传递。但是在一个函数上添加throws意味着其它对该函数进行调用的代码同样需要处理该throws声明。在一个代码复用性比较好的系统中，这些throws会非常快速地蔓延开来。如果不去处理Checked Exception，而是将其通过throws抛出，那么会有越来越多的函数受到影响。在这种情况下，我们要在多处对该Checked Exception进行处理。

如果在蔓延的过程中所遇到的是一个函数的重载或者接口的实现，那么事情就会变得更加麻烦了。这是因为一个函数声明中的throws实际上是函数签名的一部分。如果在函数重载或接口实现中添加了一个throws，那么为了保持原有的关系，被重载的函数或被实现的接口中的相应函数同样需要添加一个throws声明。而这样的改动则会导致其它函数重载及接口实现同样需要更改：

<img src="{{site.cdnurl}}/img/post/2016/exception-method.jpg" alt="jpg" style="background-color:white">

在上图中，我们显示了在一个接口声明中添加throws的严重后果。在一开始，我们在应用中实现了接口函数Interface::method()。此时在应用以及第三方应用中拥有六种对它的实现。但是如果A::method()的实现中抛出了一个Checked Exception，那么其就会要求接口中的相应函数也添加该throws声明。一旦在接口中添加了throws声明，那么在应用以及第三方应用中的所有对该接口的实现都需要添加该throws声明，即使在这些实现中并不存在可能抛出该异常的函数调用。

那么我们应该怎么解决这个问题呢？首先，我们应该尽早地对Checked Exception进行处理。这是因为随着Checked Exception沿着函数调用的轨迹向上传递的过程中，这些被抛出的Checked Exception的意义将逐渐模糊。例如在startupApplication()函数中，我们可能需要读取用户的配置文件来根据用户的原有偏好配置应用。由于该段逻辑需要读取用户的配置文件，因此其内部逻辑在运行时将可能抛出FileNotFoundException。如果这个FileNotFoundException没有及时地被处理，那么startupApplication()函数的签名将如下所示：

```java
public void startupApplication() throws FileNotFoundException {
    ……
}
```
在启动一个应用的时候可能会产生一个FileNotFoundException异常？是的，这很容易理解，但是到底哪里发生了异常？读取偏好文件的时候还是加载Dll的时候？应用或用户需要针对该异常进行什么样的处理？此时我们所能做的只能是通过分析该异常实例中所记录的信息来判断到底哪里有异常。

反过来，如果我们在产生Checked Exception的时候立即对该异常进行处理，那么此时我们将拥有有关该异常的最为丰富的信息：

```java
public void readPreference() {
    ……
    try {
        FileReader fileReader = new FileReader(preferenceFile);
    } catch(FileNotFoundException exception) {
        // 在日志中添加一条记录并使用默认设置
    }
    ……
}
```

但是在用户那里看来，他曾经所设置的偏好在这次使用时候已经不再有效了。这是我们的程序在运行时所产生的异常情况，因此我们需要通知用户：因为原来的偏好文件不再存在了，因此我们将使用默认的应用设置。而这一切则是通过一个在我们的应用中定义的RuntimeException类的派生类来完成的：

```java
public void readPreference() {
    ……
    try {
        FileReader fileReader = new FileReader(preferenceFile);
    } catch(FileNotFoundException exception) {
        logger.log(“Could not find user preference setting file: {0}”, preferenceFile);
        throw ApplicationSpecificException(PREFERENCE_NOT_FOUND, exception);
    }
    ……
}
```

可以看到，此时在catch块中所抛出的ApplicationSpecificException异常中已经包含了足够多的信息。这样，我们的应用就可以通过捕获ApplicationSpecificException来统一处理它们并将最为详尽的信息显示给用户，从而通知他因为无法找到偏好文件而使用默认设置：

```java
try {
    startApplication();
} catch(ApplicationSpecificException exception) {
    showWarningMessage(exception.getMessage());
}
```

**手足无措的API使用者**

另一种和Checked Exception相关的问题就是对它的随意处理。在前面的讲解中您或许已经知道了，如果一个Checked Exception不能在对API进行调用的函数中被处理，那么该函数就需要添加throws声明，从而导致多处代码需要针对该Checked Exception进行修改。那么好，为了避免这种情况，我们就尽早地对它进行处理。但是在查看该API文档的时候，我们却发现文档中并没有添加任何有关该Checked Exception的详细解释：

```java
/**
 * ……
 * throws SomeCheckedException
 */
public void someFunction() throws SomeCheckedException {
    ……
}
```

而且我们也没有办法从该函数的签名中看出到底为什么这个函数会抛出该异常，进而也不知道该异常是否需要对用户可见。在这种情况下，我们只有截获它并在日志中添加一条记录了事：

```java
try {
    someFunction();
} catch(SomeCheckedException exception) {
    // 在日志中添加一条记录
}
```

很显然，这并不是一种好的做法。而这一切的根本原因则是没有说清楚到底为什么函数会抛出该Checked Exception。因此对于一个API编写者而言，由于throws也是函数声明的一部分，因此为一个函数所能抛出的Checked Exception添加清晰准确的文档实际上是非常重要的。

**疲于应付的API用户**

除了没有清晰的文档之外，另一种让API用户非常抵触的就是过度地对Checked Exception进行使用。

或许您已经接触过类似的情况：一个类库中用于取得数据的API，如getData(int index)，通过throws抛出一个异常，以表示API用户所传入的参数index是一个非法值。可以想象得到的是，由于getData()可能会被非常频繁地使用，因此软件开发人员需要在每一处调用都使用try … catch …块来截获该异常，从而使代码显得凌乱不堪。

如果一个类库拥有一个这样的API，那么该类库中的这种对Checked Exception的不恰当使用常常不止一个。那么该类库的这些API会大量地污染用户代码，使得这些用户代码中充斥着不必要也没有任何意义的try…catch…块，进而让代码逻辑显得极为晦涩难懂。

```java
Record record = null;
try {
    record = library.getDataAt(2);
} catch(InvalidIndexException exception) {
    …… // 异常处理逻辑
}
record.setIntValue(record.getIntValue() * 2);
try {
    library.setDataAt(2, record);
} catch(InvalidIndexException exception) {
    …… // 异常处理逻辑
}
```

反过来，如果这些都不是Checked Exception，而且软件开发人员也能保证传入的索引是合法的，那么代码会简化很多：

```java
Record record = library.getDataAt(2);
record.setIntValue(record.getIntValue() * 2);
library.setDataAt(2, record);
```

那么我们应该在什么时候使用Checked Exception呢？就像前面所说的，如果一个异常所表示的并不是代码本身的不足所导致的非正常状态，而是一系列应用本身也无法控制的情况，那么我们将需要使用Checked Exception。就以前面所列出的FileReader类的构造函数为例：

```java
public FileReader(String fileName) throws FileNotFoundException
```

该构造函数的签名所表示的意义实际上是：

必须通过传入的参数fileName来标示需要打开的文件
如果文件存在，那么该构造函数将返回一个FileReader类的实例
对该构造函数进行使用的代码必须处理由fileName所标示的文件不存在，进而抛出FileNotFoundException的情况
也就是说，Checked Exception实际上是API设计中的一部分。在调用这个API的时候，你不得不处理目标文件不存在的情况。而这则是由文件系统的自身特性所导致的。而之所以Checked Exception导致了如此多的争论和误用，更多是因为我们在用异常这个用来表示应用中的运行错误这个语言组成来通知用户他所必须处理的应用无法控制的可能情况。也就是说，其为异常赋予了新的含义，使得异常需要表示两个完全不相干的概念。而在没有仔细分辨的情况下，这两个概念是极容易混淆的。因此在尝试着定义一个Checked Exception之前，API编写者首先要考虑这个异常所表示的到底是系统自身缺陷所导致的运行错误，还是要让用户自己来处理的边缘情况。

**正确地使用Checked Exception**

实际上，如何正确地使用Checked Exception已经在前面的各章节讲解中进行了详细地说明。在这里我们再次做一个总结，同时也用来加深一下印象。

从API编写者的角度来讲，他所需要考虑的就是在何时使用一个Checked Exception。

首先，Checked Exception应当只在异常情况对于API以及API的使用者都无法避免的情况下被使用。例如在打开一个文件的时候，API以及API的使用者都没有办法保证该文件一定存在。反过来，在通过索引访问数据的时候，如果API的使用者对参数index传入的是-1，那么这就是一个代码上的错误，是完全可以避免的。因此对于index参数值不对的情况，我们应该使用Unchecked Exception。

其次，Checked Exception不应该被广泛调用的API所抛出。这一方面是基于代码整洁性的考虑，另一方面则是因为Checked Exception本身的实际意义是API以及API的使用者都无法避免的情况。如果一个应用有太多处这种“无法避免的异常”，那么这个程序是否拥有足够的质量也是一个很值得考虑的问题。而就API提供者而言，在一个主要的被广泛使用的功能上抛出这种异常，也是对其自身API的一种否定。

再次，一个Checked Exception应该有明确的意义。这种明确意义的标准则是需要让API使用者能够看到这个Checked Exception所对应的异常类，该异常类所包含的各个域，并阅读相应的API文档以后就能够了解到底哪里出现了问题，进而向用户提供准确的有关该异常的解释。

而对于API的用户而言，一旦遇到了一个API会抛出Checked Exception，那么他就需要考虑使用一个Wrapped Exception来将该Checked Exception包装起来。那什么是Wrapped Exception呢？

简单地说，Wrapped Exception就是将一个异常包装起来的异常。在try…catch…块捕获到一个异常的时候，该异常内部所记录的消息可能并不合适。就以前面我们已经举过的加载偏好的示例为例。在启动时，应用会尝试读取用户的偏好设置。这些偏好设置记录在了一个文件中，却可能已经被误删除。在这种情况下，对该偏好文件的读取会导致一个FileNotFoundException抛出。但是在该异常中所记录的信息对于用户，甚至应用编写者而言没有任何价值：“Could not find file preference.xml while opening file”。在这种情况下，我们就需要构造一个新的异常，在该异常中标示准确的错误信息，并将FileNotFoundException作为新异常的原因：

```java
public void readPreference() {
    ……
    try {
        FileReader fileReader = new FileReader(preferenceFile);
    } catch(FileNotFoundException exception) {
        logger.log(“Could not find user preference setting file: {0}” preferenceFile);
        throw ApplicationSpecificException(PREFERENCE_NOT_FOUND, exception);
    }
    ……
}
```

上面的示例代码中重新抛出了一个ApplicationSpecificException类型的异常。从它的名字就可以看出，其应该是API使用者在应用实现中所添加的应用特有的异常。为了避免调用栈中的每一个函数都需要添加throws声明，该异常需要从RuntimeException派生。这样应用就可以通过在调用栈的最底层捕捉这些异常并对这些异常进行处理：在系统日志中添加一条异常记录，只对用户显示异常中的消息，以防止异常内部的调用栈信息暴露过多的实现细节等：

```java
try {
    ……
} catch(ApplicationSpecificException exception) {
    logger.log(exception.getLevel(), exception.getMessage(), exception);
    // 将exception内部记录的信息显示给用户（或添加到请求的响应中返回）
    // 如showWarningMessage(exception.getMessage());
}
```