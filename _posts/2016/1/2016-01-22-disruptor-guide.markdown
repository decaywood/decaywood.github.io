---
layout:     post
random-img: true
title:      Disruptor入门
subtitle:   Disruptor Guide
date:       2016-01-22 17:27:18
author:     decaywood
description: 本文主要介绍了一下Disruptor的总体框架以及一些优化细节，并大致讲解了一下使用方法，Disruptor作为一个并发库，有着比JDK内置工具更优秀的性能，其对并发性能的优化深入到了Java底层甚至CUP指令级别，能够深入的研究下去对于Java内存模型甚至计算机体系都会有全新的认识，是一个非常值得学习的一个框架！后续我会继续对Disruptor的源码进行分析，彻底揭开Disruptor“快”的本质。
keywords: Disruptor,RingBuffer,EventHandler,EventProcessor,EventFactory,缓存行填充,伪共享,CAS
tags:
    - Java
    - 并发编程
    - 框架
---

## Disruptor是什么

Disruptor是一个开源的Java框架，它被设计用于在生产者—消费者问题（producer-consumer problem，简称PCP）上获得尽量高的吞吐量（TPS,Transaction Per Second)）和尽量低的延迟。Disruptor是LMAX在线交易平台的关键组成部分，LMAX平台使用该框架对订单处理速度能达到600万TPS，除金融领域之外，其他一般的应用中都可以用到Disruptor，它可以带来显著的性能提升。

笔者之前也有幸用这个框架做过一个[自娱自乐的项目(LoftPage)](https://github.com/decaywood/LoftPage)，刚接触这个框架的时候就觉得这个框架很新颖，竟然性能比JDK内置的阻塞队列快这么多(官方宣称一个数量级)，一直想深入研究一下Disruptor的原理，不过因为事情太多不了了之。一年后有机会重新对Disruptor进行了解，最新版已经是3.0版了，目前这个框架已经趋于稳定，少有变动了。

其实Disruptor与其说是一个框架，不如说是一种设计思路，这个设计思路为存在“并发、缓冲区、生产者—消费者模型、事务处理”这些元素的程序提供了一种大幅提升性能（TPS）的方案。

从功能上来看，Disruptor实现了“队列”的功能，而且是一个有界队列。那么它的应用场景自然就是“生产者-消费者”模型的应用场合了。可以拿JDK的BlockingQueue做一个简单对比，以便更好地认识Disruptor是什么。

我们知道BlockingQueue是一个FIFO队列，生产者(Producer)往队列里发布(publish)一项事件(或称之为“消息”也可以)时，消费者(Consumer)能获得通知；如果没有事件时，消费者被堵塞，直到生产者发布了新的事件。这些都是Disruptor能做到的，与之不同的是，Disruptor能做更多:

* 同一个“事件”可以有多个消费者，消费者之间既可以并行处理，也可以相互依赖形成处理的先后次序(形成一个依赖图)

* 预分配用于存储事件内容的内存空间

* 针对极高的性能目标而实现的极度优化和无锁的设计

以上的描述虽然简单地指出了Disruptor是什么，但对于它“能做什么”还不是那么直截了当。一般性地来说，当你需要在两个独立的处理过程(两个线程)之间交换数据时，就可以使用Disruptor。当然使用队列（如上面提到的BlockingQueue）也可以，只不过Disruptor做得更好。

## 一些重要的概念

在对Disruptor的特性进行说明之前，有必要对几个概念做一些说明。

### CAS

CAS是Compare and Swap的简写，顾名思义，这个方法的功能就是比较和替换。简单来说，比较和替换是使用一个期望值和一个变量的当前值进行比较，如果当前变量的值与我们期望的值相等，就使用一个新值替换当前变量的值。java.util.concurrent包完全建立在CAS之上，可见其在并发上的重要程度。

CAS在Java中是由Native方法实现的，具体细节在这就不再深究了，大致使用了机器指令级别的原子性优化，所以CAS提供了高效无锁的原子操作。

```java
public final native boolean compareAndSwapInt(Object o, long offset,
                                              int expected,
                                              int x);
```

### 伪共享

CUP的伪共享问题的本质是：几个在逻辑上独立的变量，由于被cpu加载在同一个缓存行当中，当在多线程环境下，被不同的cpu执行，导致缓存行失效从而引起Cache命中率大幅降低。例如：当两个线程分别对一个数组中的两份数据进行写操作，每个线程操作不同index上的数据，看上去，两份数据之间是不存在同步问题的，但是，由于他们可能在同一个cpu缓存行当中，这就会使这一份缓存行出现大量的缓存失效。如前所述，当一份线程更新时要给另一份线程发送RFO（请求所有权/Request For Ownership,RFO）消息并使其缓存失效。解决这个问题的一个办法是让这个数组中不同index的数据在不同的缓存行：因为缓存行的大小是64个字节，那么只要让数组中每份数据的大小大于64个字节，就可以保证他们在不同的缓存行当中，就能避免这样的伪共享问题。不过这样做缺点也很明显，过多没意义的数据占用了宝贵的cache空间，故这种优化不到迫不得已还是慎用。

### 锁

区分竞争锁和非竞争锁对性能的影响非常重要。如果一个锁自始至终只被一个线程使用，那么JVM有能力优化它带来的绝大部分损耗。如果一个锁被多个线程使用过，但是在任意时刻，都只有一个线程尝试获取锁，那么它的开销要大一些。我们将以上两种锁称为非竞争锁。而对性能影响最严重的情况出现在多个线程同时尝试获取锁时。这种情况是JVM无法优化的，而且通常会发生从用户态到内核态的切换。现代JVM已对非竞争锁做了很多优化，使它几乎不会对性能造成影响。常见的优化有以下几种。

* 如果一个锁对象只能由当前线程访问，那么其他线程无法获得该锁并发生同步,因此JVM可以去除对这个锁的请求。
* 逃逸分析(escape analysis)可以识别本地对象的引用是否在堆中被暴露。如果没有，就可以将本地对象的引用变为线程本地的(thread local)。
* 编译器还可以进行锁的粗化(lock coarsening)。把邻近的synchronized块用相同的锁合并起来，以减少不必要的锁的获取和释放。因此，不要过分担心非竞争锁带来的开销，要关注那些真正发生了锁竞争的临界区中性能的优化。

## Disruptor为什么这么快

### 利用CAS

使用CAS来保证多线程安全,与大部分并发队列使用的锁相比，CAS显然要快很多。CAS是CPU级别的指令，更加轻量，不必像锁一样需要操作系统提供支持，所以每次调用不需要在用户态与内核态之间切换，也不需要上下文切换。

### 缓存行填充

CPU缓存常以64 Bytes作为一个缓存行大小，缓存由若干个缓存行组成，缓存写回主存或主存写入缓存均是以行为单位，此外每个CPU核心都有自己的缓存（但是若某个核心对某缓存行做出修改，其他拥有同样缓存的核心需要进行同步），生产者和消费者的指针用long型表示，假设现在只有一个生产者和一个消费者，那么双方的指针间没有什么直接联系，只要不“挨着”，应该可以各改各的指针。OK前面说有点乱，但都是前提，下面问题来了：如果生产者和消费者的指针（加起来共16bytes）出现在同一个缓存行中会怎么样？例如CPU核心A运行的消费者修改了一下自己的指针值(P1)，那么其他核心中所有缓存了P1的缓存行都将失效，并从主存重新调配。这样做的缺点显而易见，但是CPU和编译器并未聪明到避免这个问题，所以需要缓存行填充。虽然问题产生的原因很绕，但是解决方案却非常简单：对于一个long型的缓冲区指针，用一个长度为8的long型数组代替。如此一来，一个缓存行被这个数组填充满，线程对各自指针的修改不会干扰到他人。

### 避免垃圾回收

系统在高压力情况下频繁新建对象必定导致更频繁的GC,Disruptor避免这个问题的策略是：提前分配。在创建RingBuffer实例时，参数中要求给出缓冲区元素类型的Factory，创建实例时，Ring Buffer会首先用由Factory产生的实例将整个缓冲区填满，后面生产者生产时，不再直接新建对象，而是获得之前已经新建好的实例，然后设置其中的值。

### 批量操作

Disruptor默认的BatchEventProcessor会尽量把能处理的事件一次性处理完，而不是处理完一个事件就立即让出CPU资源。这种机制有效地减少了线程间竞争的概率。

## Disruptor的组件模型

此小节将讲解一下Disruptor的一些主要组件的功能，进一步了解Disruptor的整体架构。

### Ring Buffer

RingBuffer是存储消息的地方，通过一个名为cursor的Sequence对象指示队列的头，协调多个生产者向RingBuffer中添加消息，并用于在消费者端判断RingBuffer是否为空。巧妙的是，表示队列尾的Sequence并没有在RingBuffer中，而是由消费者维护。这样的好处是多个消费者处理消息的方式更加灵活，可以在一个RingBuffer上实现事件的并行或者顺序处理甚至两种方式组合处理。其缺点是在生产者端判断RingBuffer是否已满是需要跟踪更多的信息，为此，在RingBuffer中维护了一个名为gatingSequences的Sequence数组来跟踪相关Seqence。但从3.0版本开始，其职责被简化为仅仅负责对通过 Disruptor 进行交换的数据（事件）进行存储和更新。在一些更高级的应用场景中，Ring Buffer 可以由用户的自定义实现来完全替代。

### Sequence

Sequence是Disruptor最核心的组件。其通过顺序递增的序号来编号管理通过其进行交换的数据（事件），对数据(事件)的处理过程总是沿着序号逐个递增处理。一个Sequence用于跟踪标识某个特定的事件处理者(RingBuffer/Consumer)的处理进度。生产者对RingBuffer的互斥访问，生产者与消费者之间的协调以及消费者之间的协调，都是通过Sequence实现。几乎每一个重要的组件都包含Sequence。由于需要在线程间共享，所以Sequence是引用传递，并且是线程安全的；再次，Sequence支持CAS操作；最后，为了提高效率，Sequence通过padding来避免伪共享。

### Sequencer

Sequencer 是 Disruptor 的真正核心。此接口有两个实现类 SingleProducerSequencer、MultiProducerSequencer ，它们定义在生产者和消费者之间快速、正确地传递数据的并发算法。

### Sequence Barrier

SequenceBarrier用来在消费者之间以及消费者和RingBuffer之间建立依赖关系。在Disruptor中，依赖关系实际上指的是Sequence的大小关系，消费者A依赖于消费者B指的是消费者A的Sequence一定要小于等于消费者B的Sequence，这种大小关系决定了处理某个消息的先后顺序。因为所有消费者都依赖于RingBuffer，所以消费者的Sequence一定小于等于RingBuffer中名为cursor的Sequence，即消息一定是先被生产者放到Ringbuffer中，然后才能被消费者处理。  SequenceBarrier在初始化的时候会收集需要依赖的组件的Sequence，RingBuffer的cursor会被自动的加入其中。需要依赖其他消费者和/或RingBuffer的消费者在消费下一个消息时，会先等待在SequenceBarrier上，直到所有被依赖的消费者和RingBuffer的Sequence大于等于这个消费者的Sequence。当被依赖的消费者或RingBuffer的Sequence有变化时，会通知SequenceBarrier唤醒等待在它上面的消费者。

### Wait Strategy

Disruptor 定义了 com.lmax.disruptor.WaitStrategy 接口用于抽象 Consumer 如何等待新事件，这是策略模式的应用。当消费者等待在SequenceBarrier上时，Disruptor 提供了多个WaitStrategy的实现，每种策略都具有不同性能和优缺点。在延迟和CPU资源的占用上有所不同，根据实际运行环境的CPU的硬件特点选择恰当的策略，并配合特定的JVM的配置参数，能够实现不同的性能提升。

* BusySpinWaitStrategy：自旋等待，类似Linux Kernel使用的自旋锁。低延迟但同时对CPU资源的占用也多。

* BlockingWaitStrategy ：使用锁和条件变量。CPU资源的占用少，延迟大。

* SleepingWaitStrategy ：在多次循环尝试不成功后，选择让出CPU，等待下次调度，多次调度后仍不成功，尝试前睡眠一个纳秒级别的时间再尝试。这种策略平衡了延迟和CPU资源占用，但延迟不均匀。

* YieldingWaitStrategy ：在多次循环尝试不成功后，选择让出CPU，等待下次调度。平衡了延迟和CPU资源占用，但延迟比较均匀。

* PhasedBackoffWaitStrategy ：上面多种策略的综合，CPU资源的占用少，延迟大。

### EventProcessor

在Disruptor中，消费者是以EventProcessor的形式存在的。EventProcessor持有特定消费者(Consumer)的Sequence，并提供用于调用事件处理实现的事件循环(Event Loop)。

### EventHandler

Disruptor 定义的事件处理接口，由用户实现，用于处理事件，是Consumer的真正实现。

### Producer

即生产者，只是泛指调用 Disruptor 发布事件的用户代码，Disruptor 没有定义特定接口或类型。

## 整体结构图

<img src="{{site.cdnurl}}/img/post/2016/Disruptor-structure.svg" alt="SVG" style="background-color:white">

## 如何使用Disruptor

Disruptor的jar包可以在[Maven库](http://search.maven.org/#search%7Cga%7C1%7Cdisruptor)中找到，也可以到[Github](https://github.com/LMAX-Exchange/disruptor/wiki/Downloads)中Disruptor项目中下载。接下来，我们以生产者与消费者之间传long型数据为例来演示如何使用Disruptor，生产者产生long型数据，消费者将其打印出来。

### 定义事件

事件(Event)就是通过Disruptor进行数据交换的载体，long型数据通过LongEvent在Disruptor中传递。

```java
/**
 * @author: decaywood
 * @date: 2016/1/24 19:10
 */
public class LongEvent {

    private long value;

    public void set(long value) {
        this.value = value;
    }
}
```
### 定义事件工厂

事件工厂(EventFactory)定义了如何实例化前面第1步中定义的事件(Event)，需要实现接口EventFactory\<T\>。Disruptor 通过 EventFactory 在 RingBuffer 中预创建 Event 的实例。一个Event实例实际上被用作一个“数据槽”，发布者发布前，先从 RingBuffer 获得一个Event的实例，然后往Event实例中填充数据，之后再发布到RingBuffer中，之后由Consumer获得该Event实例并从中读取数据。

```java
/**
 * @author: decaywood
 * @date: 2016/1/24 19:19
 */
import com.lmax.disruptor.EventFactory;

public class LongEventFactory implements EventFactory<LongEvent> {

    public LongEvent newInstance() {
        return new LongEvent();
    }
    
}
```

### 定义事件处理的具体实现

事件定义好后，消费者需要处理具体事件，具体的处理逻辑可以在EventHandler\<T\>中实现。

```java
import com.lmax.disruptor.EventHandler;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:21
 */
public class LongEventHandler implements EventHandler<LongEvent> {

    public void onEvent(LongEvent event, long sequence, boolean endOfBatch) {
        System.out.println("Event: " + event);
    }
    
}
```

### 启动Disruptor

Disruptor 通过ExecutorService提供的线程来触发Consumer的事件处理。

Disruptor 定义了WaitStrategy接口用于抽象Consumer如何等待新事件，这是策略模式的应用。Disruptor提供了多个WaitStrategy的实现，每种策略都具有不同性能和优缺点，根据实际运行环境的CPU的硬件特点选择恰当的策略，并配合特定的 JVM 的配置参数，能够实现不同的性能提升。具体策略前面已经进行过介绍，在此不再赘述。

```java
import com.lmax.disruptor.EventHandler;
import com.lmax.disruptor.YieldingWaitStrategy;
import com.lmax.disruptor.dsl.Disruptor;
import com.lmax.disruptor.dsl.ProducerType;

import java.util.concurrent.Executors;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:09
 */
public class DisruptorStart {

    public static void main(String[] args) {
    
        LongEventFactory factory = new LongEventFactory();
        int ringBufferSize = 1024 * 1024; // RingBuffer 大小，必须是2的幂

        //单生产者模式
        Disruptor<LongEvent> disruptor = new Disruptor<>(factory,
                ringBufferSize, Executors.defaultThreadFactory(),
                ProducerType.SINGLE,
                new YieldingWaitStrategy());

        EventHandler<LongEvent> eventHandler = new LongEventHandler();
        disruptor.handleEventsWith(eventHandler);

        disruptor.start();
    }
}
```

此时，Disruptor就已经可以工作了。

### 发布事件

我们假定一个生产者，先不管数据从何而来，假定数据从网络IO或者磁盘IO中获取的，拿到数据后系统自动回调onData方法。

```java
import com.lmax.disruptor.RingBuffer;
import java.nio.ByteBuffer;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:25
 */
public class LongEventProducer {

    private final RingBuffer<LongEvent> ringBuffer;

    public LongEventProducer(RingBuffer<LongEvent> ringBuffer) {
        this.ringBuffer = ringBuffer;
    }

    public void onData(ByteBuffer bb) {
        long sequence = ringBuffer.next();  // 获取下一个序列号
        try {
            LongEvent event = ringBuffer.get(sequence); // 根据序列号获取预分配的数据槽
            event.set(bb.getLong(0));  // 向数据槽中填充数据
        } finally {
            ringBuffer.publish(sequence);
        }
    }
}
```

注意，最后的ringBuffer.publish方法必须包含在finally中以确保必须得到调用；如果某个请求的sequence未被提交，将会堵塞后续的发布操作或者其它的producer。Disruptor还提供另外一种形式的调用来简化以上操作，并确保 publish 总是得到调用。

```java
import com.lmax.disruptor.EventTranslatorOneArg;
import com.lmax.disruptor.RingBuffer;

import java.nio.ByteBuffer;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:27
 */

public class LongEventProducerWithTranslator {
    private final RingBuffer<LongEvent> ringBuffer;

    public LongEventProducerWithTranslator(RingBuffer<LongEvent> ringBuffer) {
        this.ringBuffer = ringBuffer;
    }

    private static final EventTranslatorOneArg<LongEvent, ByteBuffer> TRANSLATOR =
            new EventTranslatorOneArg<LongEvent, ByteBuffer>() {
                public void translateTo(LongEvent event, long sequence, ByteBuffer bb) {
                    event.set(bb.getLong(0));
                }
            };

    public void onData(ByteBuffer bb) {
        ringBuffer.publishEvent(TRANSLATOR, bb);
    }
}
```

Disruptor根据传入的参数提供了几种Translator接口(EventTranslator, EventTranslatorOneArg, EventTranslatorTwoArg)，使用种Translator有几点好处：

* 封装了发布的复杂性，防止遗漏ringBuffer.publish方法
* 可以将逻辑分散到单独的类中
* 可以使用Java8的lambda表达式表示Translator，使语法更简洁

### 关闭Disruptor

注意，如果Disruptor使用结束后，记得释放资源

```java
disruptor.shutdown();//关闭 disruptor，方法会堵塞，直至所有的事件都得到处理；
```

### 整体调用流程

整体的调用过程

```java
import com.lmax.disruptor.RingBuffer;
import com.lmax.disruptor.YieldingWaitStrategy;
import com.lmax.disruptor.dsl.Disruptor;
import com.lmax.disruptor.dsl.ProducerType;

import java.nio.ByteBuffer;
import java.util.concurrent.Executors;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:30
 */
public class LongEventMain {
    public static void main(String[] args) throws Exception {
        // 事件工厂
        LongEventFactory factory = new LongEventFactory();

        // 指明RingBuffer的大小，必须为2的幂
        int bufferSize = 1024;

        Disruptor<LongEvent> disruptor = new Disruptor<>(factory,
                bufferSize, Executors.defaultThreadFactory(),
                ProducerType.SINGLE,
                new YieldingWaitStrategy());

        // 置入处理逻辑
        disruptor.handleEventsWith(new LongEventHandler());

        disruptor.start();

        // 获取ringBuffer，用于发布事件
        RingBuffer<LongEvent> ringBuffer = disruptor.getRingBuffer();

        LongEventProducer producer = new LongEventProducer(ringBuffer);

        ByteBuffer bb = ByteBuffer.allocate(8);
        for (long l = 0; true; l++) {
            bb.putLong(0, l);
            producer.onData(bb);
            Thread.sleep(1000);
        }
    }
}
```

整体的调用过程,这次引入Java8的lambda表达式：

```java
import com.lmax.disruptor.RingBuffer;
import com.lmax.disruptor.YieldingWaitStrategy;
import com.lmax.disruptor.dsl.Disruptor;
import com.lmax.disruptor.dsl.ProducerType;

import java.nio.ByteBuffer;
import java.util.concurrent.Executors;

/**
 * @author: decaywood
 * @date: 2016/1/24 19:30
 */

public class LongEventMain {
    public static void main(String[] args) throws Exception {

        // 指明RingBuffer的大小，必须为2的幂
        int bufferSize = 1024;

        // 实例化Disruptor
        Disruptor<LongEvent> disruptor = new Disruptor<>(LongEvent::new,
                bufferSize, Executors.defaultThreadFactory(),
                ProducerType.SINGLE,
                new YieldingWaitStrategy());

        // 置入处理逻辑
        disruptor.handleEventsWith((event, sequence, endOfBatch) -> System.out.println("Event: " + event));

        disruptor.start();

        // 获取ringBuffer，用于发布事件
        RingBuffer<LongEvent> ringBuffer = disruptor.getRingBuffer();

        LongEventProducer producer = new LongEventProducer(ringBuffer);

        ByteBuffer bb = ByteBuffer.allocate(8);
        for (long l = 0; true; l++) {
            bb.putLong(0, l);
            ringBuffer.publishEvent((event, sequence, buffer) -> event.set(buffer.getLong(0)), bb);
            Thread.sleep(1000);
        }
    }
}
```
可以看见，Java8完全可以省掉Handler, Translator的定义

## 性能对比

为了直观地感受Disruptor有多快，作者设计了一个性能对比测试：Producer发布100万次事件，从发布第一个事件开始计时，捕捉Consumer处理完所有事件的耗时。

在此就不详细阐述对比过程了，从测试结果看， Disruptor的性能比ArrayBlockingQueue高出了几乎一个数量级

## Disruptor的一些高级特性


### 并行的事件处理

Disruptor提供多消费者并行处理事件的功能，使用如下配置即可：

```java
... other code

//handler1~4会并行处理事件
disruptor.handleEventsWith(handler1, handler2, handler3, handler4);
RingBuffer<ValueEvent> ringBuffer = disruptor.start();

... other code

```

### 有顺序依赖的事件处理

Disruptor也提供多有先后顺序的消费者处理流程：

```java
... other code
//handler1先于handler2、3、4处理事件，后三者并行处理
disruptor.handleEventsWith(handler1).then(handler2, handler3, handler4);
//handler5、6、7、8依次处理事件
disruptor.handleEventsWith(handler5).then(handler6).then(handler7).then(handler8);
RingBuffer<ValueEvent> ringBuffer = disruptor.start();
... other code

```

### 多链事件处理

Disruptor允许创建多个处理流程，链与链之间为并行处理关系，链中的handler为顺序关系：

```java
... other code
//A链 handler1与2有先后顺序
disruptor.handleEventsWith(handler1).then(handler2);
//B链 handler3与4有先后顺序
disruptor.handleEventsWith(handler3).then(handler4);
//A链与B链为并行关系，没有顺序依赖
... other code

```

### 使用自定义的事件处理器

一般而言，提供了EventHandler 后，Disruptor会默认实例化一个BatchEventProcessor，由于Disruptor的EventProcessor不一定满足用户需求，用户可以自定义EventProcessor：

```java
RingBuffer<TestEvent> ringBuffer = disruptor.getRingBuffer();
SequenceBarrier barrier = ringBuffer.newBarrier();
final MyEventProcessor customProcessor = new MyEventProcessor(ringBuffer, barrier);
disruptor.handleEventsWith(processor);
disruptor.start();
```

Disruptor将在start()方法调用后执行自定义的processor。如果需要自定义的processor按指定顺序处理事件，例如指定customProcessor在handler1、2之后处理event可以这样写：

```java
SequenceBarrier barrier = disruptor.handleEventsWith(handler1, handler2).asBarrier();
final MyEventProcessor customProcessor = new MyEventProcessor(ringBuffer, barrier);
disruptor.handleEventsWith(customProcessor);
disruptor.start();
```

## 小结

本文主要介绍了一下Disruptor的总体框架以及一些优化细节，并大致讲解了一下使用方法，Disruptor作为一个并发库，有着比JDK内置工具更优秀的性能，其对并发性能的优化深入到了Java底层甚至CUP指令级别，能够深入的研究下去对于Java内存模型甚至计算机体系都会有全新的认识，是一个非常值得学习的一个框架！后续我会继续对Disruptor的源码进行分析，彻底揭开Disruptor“快”的本质。