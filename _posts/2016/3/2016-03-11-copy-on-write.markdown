---
layout:     post
random-img: true
title:      Copy-On-Write 容器
subtitle:   Copy-On-Write Collection
date:       2016-03-11 22:43:48
author:     decaywood
description: Copy-On-Write简称COW，是一种用于程序设计中的优化策略。其基本思路是，从一开始大家都在共享同一个内容，当某个人想要修改这个内容的时候，才会真正把内容Copy出去形成一个新的内容然后再改，这是一种延时懒惰策略。
keywords: Copy-On-Write
tags:
    - Java
    - 并发编程
---

## 什么是CopyOnWrite容器

Copy-On-Write简称COW，是一种用于程序设计中的优化策略。其基本思路是，当某个线程想要修改某个内容的时候，容器会把数据拷贝一份进行修改。这是一种延时懒惰策略。从JDK1.5开始Java并发包里提供了两个使用CopyOnWrite机制实现的并发容器,它们是CopyOnWriteArrayList和CopyOnWriteArraySet。CopyOnWrite容器非常有用，可以在非常多的并发场景中使用到。

## CopyOnWriteArrayList的实现原理

在使用CopyOnWriteArrayList之前，先阅读其源码了解下它是如何实现的。从源码中可以发现CopyOnWriteArrayList在添加元素的时候使用了重入锁（更多关于锁的内容可以看看本博客的[Java并发中的Lock](/2016/03/06/Lock-intro/)一文）来保证数据的一致性，否则多线程写的时候会Copy出N个副本出来。实际上，任何涉及到数据修改的操作都进行了相应的细粒度同步。

```java
    /**
     * Appends the specified element to the end of this list.
     *
     * @param e element to be appended to this list
     * @return {@code true} (as specified by {@link Collection#add})
     */
    public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

对于数据的读取，由于不涉及数据修改，所以和普通的ArrayList没有什么区别。不过如果读的时候有多个线程正在向CopyOnWriteArrayList添加数据，还是会读到旧的数据，直到所读数组的引用指向修改后的新数组时，才会得到最新的数据。

## CopyOnWrite的应用场景

CopyOnWrite并发容器用于读多写少的并发场景。比如可以作为内存缓存，减轻数据库的读取压力等等。相对于磁盘IO，内存速度还是有极大的优势的。除此之外，将访问频度较高且很少改变的数据进行缓存能够使数据库资源得到更好的利用。不过在使用时还需要注意两点，以免造成不必要的性能开销：

* 根据实际需要，初始化CopyOnWrite并发容器的大小，避免写时CopyOnWrite并发容器扩容的开销。
* 每次添加，容器每次都会进行复制，数据尽量批量添加，以减少容器的复制次数。

## CopyOnWrite的缺点

CopyOnWrite容器有很多优点，但是同时也存在两个问题，即内存占用问题和数据一致性问题。所以在开发的时候需要注意一下。

### 内存占用问题

由于CopyOnWrite在修改数据时会进行复制，在进行写操作的时候，内存里会同时存在两组数据，旧数组的数据以及复制后的数据（注意:在复制的时候只是复制容器里的引用，只是在写的时候会创建新数组并修改数据，而旧容器的对象还在使用，所以有两组数据同时存在）。如果这些对象占用的内存比较大，同时有很多对象的引用被删除或替换，那么这个时候很有可能造成频繁的垃圾回收。

针对内存占用问题，唯一有效的办法就是避免进行频繁的删除或者修改操作，只要数组没有释放大对象的引用，就不会造成频繁的垃圾回收，也就不会有stop the world问题。在考虑CopyOnWrite并发容器的时候一定要看是否适用当前的场景。

### 数据一致性问题

CopyOnWrite容器只能保证数据的最终一致性，不能保证数据的实时一致性。所以如果你希望写入的的数据，马上能读到，请不要使用CopyOnWrite容器。

## 小结

CopyOnWrite并发容器原理大同小异，都是在有数据修改的操作中进行细粒度同步，然后对底层容器进行复制，并在复制的容器上进行修改操作，最后引用修改后的新容器来达到读写分离，思路很简单。在某些读操作较多的场景下能够很好的提高整个程序的性能。