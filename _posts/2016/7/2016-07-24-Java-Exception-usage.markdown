---
layout:     post
random-img: true
title:      如何优雅的处理异常
subtitle:   How to handle with the Java Exception
date:       2016-07-24 11:29:31
author:     decaywood
description: 如何优雅的处理Java代码异常
keywords: Exception,异常处理
tags:
    - Java
---

Java中异常提供了一种识别及响应错误情况的一致性机制，有效地异常处理能使程序更加健壮、易于调试。异常之所以是一种强大的调试手段，在于其回答了以下三个问题：

* 什么出了错?
* 在哪出的错?
* 为什么出错?

在有效使用异常的情况下，异常类型回答了“什么”被抛出，异常堆栈跟踪回答了“在哪“抛出，异常信息回答了“为什么“会抛出，如果你的异常没有回答以上全部问题，那么可能你没有很好地使用它们。有三个原则可以帮助你在调试过程中最大限度地使用好异常，这三个原则是：

* <a href='#1'>具体明确</a>
* <a href='#2'>提早抛出</a>
* <a href='#3'>延迟捕获</a>

为了阐述有效异常处理的这三个原则，本文通过杜撰个人财务管理器类JCheckbook进行讨论，JCheckbook用于记录及追踪诸如存取款,票据开具之类的银行账户活动。

### <a name='1'>具体明确</a>

Java定义了一个异常类的层次结构,其以Throwable开始，扩展出Error和Exception，而Exception又扩展出RuntimeException.如图所示：

```java
     Throwable
        /|\     
    _____|______
   |            |
   |            |
 Error      Exception
               /|\
                |
         RuntimeException
           
```

这四个类是泛化的，并不提供多少出错信息，虽然实例化这几个类是语法上合法的(如:new Throwable())，但是最好还是把它们当虚基类看，使用它们更加特化的子类。Java已经提供了大量异常子类，如需更加具体，你也可以定义自己的异常类。

例如：[java.io](http://java.io) package包中定义了Exception类的子类IOException，更加特化确的是 FileNotFoundException，EOFException和ObjectStreamException这些IOException的子 类。每一种都描述了一类特定的I/O错误：分别是文件丢失,异常文件结尾和错误的序列化对象流.异常越具体，我们的程序就能更好地回答”什么出了错”这个问题。

捕获异常时尽量明确也很重要。例如：JCheckbook可以通过重新询问用户文件名来处理FileNotFoundException，对于 EOFException，它可以根据异常抛出前读取的信息继续运行。如果抛出的是ObjectStreamException，则程序应该提示用户文件 已损坏，应当使用备份文件或者其他文件。Java让明确捕获异常变得容易,因为我们可以对同一try块定义多个catch块，从而对每种异常分别进行恰当的处理。

```java
File prefsFile = new File(prefsFilename);
 
try{
    readPreferences(prefsFile);
}
catch (FileNotFoundException e){
    // alert the user that the specified file
    // does not exist
}
catch (EOFException e){
    // alert the user that the end of the file
    // was reached
}
catch (ObjectStreamException e){
     // alert the user that the file is corrupted
}
catch (IOException e){
    // alert the user that some other I/O
    // error occurred
}
```

JCheckbook 通过使用多个catch块来给用户提供捕获到异常的明确信息。举例来说：如果捕获了FileNotFoundException，它可以提示用户指定另一 个文件，某些情况下多个catch块带来的额外编码工作量可能是非必要的负担，但在这个例子中，额外的代码的确帮助程序提供了对用户更友好的响应。

除前三个catch块处理的异常之外，最后一个catch块在IOException抛出时给用户提供了更泛化的错误信息.这样一来，程序就可以尽可能提供具体的信息，但也有能力处理未预料到的其他异常。有时开发人员会捕获范化异常，并显示异常类名称或者打印堆栈信息以求＂具体＂。千万别这么干！用户看到java.io.EOFException或者堆栈信息 只会头疼而不是获得帮助。应当捕获具体的异常并且用＂人话＂给用户提示确切的信息。不过，异常堆栈倒是可以在你的日志文件里打印。记住，异常和堆栈信息是用来帮助开发人 员而不是用户的。
最后，应该注意到JCheckbook并没有在readPreferences()中捕获异常，而是将捕获和处理异常留到用户界面层来做，这样就能用对话框或其他方式来通知用户。这被称为＂延迟捕获＂，下文就会谈到。

### <a name='2'>提早抛出</a>

异常堆栈信息提供了导致异常出现的方法调用链的精确顺序，包括每个方法调用的类名，方法名，代码文件名甚至行数，以此来精确定位异常出现的现场。

```java
java.lang.NullPointerException
at java.io.FileInputStream.open(Native Method)
at java.io.FileInputStream.<init>(FileInputStream.java:103)
at jcheckbook.JCheckbook.readPreferences(JCheckbook.java:225)
at jcheckbook.JCheckbook.startup(JCheckbook.java:116)
at jcheckbook.JCheckbook.<init>(JCheckbook.java:27)
at jcheckbook.JCheckbook.main(JCheckbook.java:318)
```

以上展示了FileInputStream类的open()方法抛出NullPointerException的情况。不过注意 FileInputStream.close()是标准Java类库的一部分，很可能导致这个异常的问题原因在于我们的代码本身而不是Java API。所以问题很可能出现在前面的其中一个方法，幸好它也在堆栈信息中打印出来了。不幸的是，NullPointerException是Java中信息量最少的（却也是最常遭遇且让人崩溃的）异常。它压根不提我们最关心的事情：到底哪里是null。所以我们不得不回退几步去找哪里出了错。

通过逐步回退跟踪堆栈信息并检查代码，我们可以确定错误原因是向readPreferences()传入了一个空文件名参数。既然readPreferences()知道它不能处理空文件名，所以马上检查该条件：

```java
public void readPreferences(String filename)
throws IllegalArgumentException{
    if (filename == null){
         throw new IllegalArgumentException("filename is null");
    }  //if
 
   //...perform other operations...
 
   InputStream in = new FileInputStream(filename);
 
   //...read the preferences file...
}
```

通过提早抛出异常（又称＂迅速失败＂），异常得以清晰又准确。堆栈信息立即反映出什么出了错（提供了非法参数值），为什么出错（文件名不能为空值），以及哪里出的错（readPreferences()的前部分）。这样我们的堆栈信息就能如实提供：

```java
java.lang.IllegalArgumentException: filename is null
at jcheckbook.JCheckbook.readPreferences(JCheckbook.java:207)
at jcheckbook.JCheckbook.startup(JCheckbook.java:116)
at jcheckbook.JCheckbook.<init>(JCheckbook.java:27)
at jcheckbook.JCheckbook.main(JCheckbook.java:318)
```

另外，其中包含的异常信息（＂文件名为空＂）通过明确回答什么为空这一问题使得异常提供的信息更加丰富，而这一答案是我们之前代码中抛出的NullPointerException所无法提供的。通过在检测到错误时立刻抛出异常来实现迅速失败，可以有效避免不必要的对象构造或资源占用，比如文件或网络连接。同样，打开这些资源所带来的清理操作也可以省却。

### <a name='3'>延迟捕获</a>

菜鸟和高手都可能犯的一个错是，在程序有能力处理异常之前就捕获它。Java编译器通过要求检查出的异常必须被捕获或抛出而间接助长了这种行为。自然而然的做法就是立即将代码用try块包装起来，并使用catch捕获异常，以免编译器报错。

问题在于，捕获之后该拿异常怎么办？最不该做的就是什么都不做。空的catch块等于把整个异常丢进黑洞，能够说明何时何处为何出错的所有信息都会永远丢失。把异常写到日志中还稍微好点，至少还有记录可查。但我们总不能指望用户去阅读或者理解日志文件和异常信息。让readPreferences()显示错误信息对话框也不合适，因为虽然JCheckbook目前是桌面应用程序，但我们还计划将它变成基于HTML的Web应用。那样的话，显示错误对话框显然不是个选择。

同时，不管HTML还是C/S版本，配置信息都是在服务器上读取的，而错误信息需要显示给Web浏览器或者客户端程序。 readPreferences()应当在设计时将这些未来需求也考虑在内。适当分离用户界面代码和程序逻辑可以提高我们代码的可重用性。

在有条件处理异常之前过早捕获它，通常会导致更严重的错误和其他异常。例如，如果上文的readPreferences()方法在调用FileInputStream构造方法时立即捕获和记录可能抛出的FileNotFoundException，代码会变成下面这样：

```java
public void readPreferences(String filename){
   //...
 
   InputStream in = null;
 
   // DO NOT DO THIS!!!
try{
    in = new FileInputStream(filename);
}
catch (FileNotFoundException e){
    logger.log(e);
}
 
in.read(...);
 
//...
}
```

上面的代码在完全没有能力从 FileNotFoundException 中恢复过来的情况下就捕获了它。如果文件无法找到，下面的方法显然无法读取它。如果readPreferences()被要求读取不存在的文件时会发生什么情况？当然，FileNotFoundException会被记录下来，如果我们 当时去看日志文件的话，就会知道。然而当程序尝试从文件中读取数据时会发生什么？既然文件不存在，变量in就是空的，一个 NullPointerException就会被抛出。

调试程序时，本能告诉我们要看日志最后面的信息。那将会是NullPointerException，非常让人讨厌的是这个异常非常不具体。错误信息不仅误导我们什么出了错（真正的错误是FileNotFoundException而不是NullPointerException），还误导了错误的出处。真正的问题出在抛出NullPointerException处的数行之外，这之间有可能存在好几次方法的调用和类的销毁。我们的注意力被这条小鱼从真正的错误处吸引了过来，一直到我们往回看日志才能发现问题的源头。

既然readPreferences() 真正应该做的事情不是捕获这些异常，那应该是什么？看起来有点有悖常理，通常最合适的做法其实是什么都不做，不要马上捕获异常。把责任交给 readPreferences()的调用者，让它来研究处理配置文件缺失的恰当方法，它有可能会提示用户指定其他文件，或者使用默认值，实在不行的话也 许警告用户并退出程序。把异常处理的责任往调用链的上游传递的办法，就是在方法的throws子句声明异常。在声明可能抛出的异常时，注意越具体越好。这用于标识出调用你方法的程序需要知晓并且准备处理的异常类型。例如，“延迟捕获”版本的readPreferences()可能是这样的：

```java
public void readPreferences(String filename)
throws IllegalArgumentException,
FileNotFoundException, IOException{
    if (filename == null){
           throw new IllegalArgumentException("filename is null");
     }  //if
 
     //...
 
     InputStream in = new FileInputStream(filename);
 
//...
}
```

技 术上来说，我们唯一需要声明的异常是IOException，但我们明确声明了方法可能抛出FileNotFoundException。 IllegalArgumentException不是必须声明的，因为它是非检查性异常（即RuntimeException的子类）。然而声明它是为 了文档化我们的代码（这些异常也应该在方法的JavaDocs中标注出来）。
当 然，最终你的程序需要捕获异常，否则会意外终止。但这里的技巧是在合适的层面捕获异常，以便你的程序要么可以从异常中有意义地恢复并继续下去，而不导致更 深入的错误；要么能够为用户提供明确的信息，包括引导他们从错误中恢复过来。如果你的方法无法胜任，那么就不要处理异常，把它留到后面捕获和在恰当的层面处理。

### 结论

经验丰富的开发人员都知道，调试程序的最大难点不在于修复缺陷，而在于从海量的代码中找出缺陷的藏身之处。只要遵循本文的三个原则，就能让你的异常协助你跟踪和消灭缺陷，使你的程序更加健壮，对用户更加友好。

