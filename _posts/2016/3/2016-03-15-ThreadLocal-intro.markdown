---
layout:     post
random-img: true
title:      ThreadLocal原理分析
subtitle:   ThreadLocal Reveal
date:       2016-03-15 21:05:26
author:     decaywood
description: ThreadLocal，也称线程本地变量。顾名思义，ThreadLocal为变量在每个线程中都创建了一个副本，那么每个线程可以访问自己内部的副本变量。其意义在于高并发场景时变量为各个线程所读时互不影响，有效地避免了线程安全问题，也避免了同步造成的性能开销。
keywords: ThreadLocal
tags:
    - Java
    - 并发编程
---

## ThreadLocal的理解

ThreadLocal，也称线程本地变量。顾名思义，ThreadLocal为变量在每个线程中都创建了一个副本，那么每个线程可以访问自己内部的副本变量。其意义在于高并发场景时变量为各个线程所读时互不影响，有效地避免了线程安全问题，也避免了同步造成的性能开销。不过使用这种技巧的同时，也会伴随着一些不可避免的缺陷：由于在每个线程中都创建了副本，所以要考虑它对资源的消耗，比如内存的占用会比不使用ThreadLocal要大。换句话来说，ThreadLocal是以空间换时间的典型例子。

## ThreadLocal类的实现

在上面谈到了对ThreadLocal的一些理解，那我们下面来看一下具体ThreadLocal是如何实现的。先了解一下ThreadLocal类提供的几个方法：

```java
public class ThreadLocal<T> {
	public T get() {...}
	public void remove() {...}
	public void set(T value) {...}
	protected T initialValue() {...}
}
```

get()方法是用来获取ThreadLocal在当前线程中保存的变量副本，set()用来设置当前线程中变量的副本，remove()用来移除当前线程中变量的副本，initialValue()是一个protected方法，一般是用来在使用时进行重写的，它是一个延迟加载方法，下面会详细说明。

首先我们来看一下ThreadLocal类是如何为每个线程创建一个变量的副本的。先看下get方法的实现：

```java
    /**
     * Returns the value in the current thread's copy of this
     * thread-local variable.  If the variable has no value for the
     * current thread, it is first initialized to the value returned
     * by an invocation of the {@link #initialValue} method.
     *
     * @return the current thread's value of this thread-local
     */
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }
```

第一句是取得当前线程，然后通过getMap(t)方法获取到一个ThreadLocalMap，然后接着下面获取到<key,value>键值对，注意这里获取键值对传进去的是 this，而不是当前线程t。如果获取成功，则返回value值。如果map为空，则调用setInitialValue方法返回value。我们上面的每一句来仔细分析,首先看一下getMap方法中做了什么：

```java
    /**
     * Get the map associated with a ThreadLocal. Overridden in
     * InheritableThreadLocal.
     *
     * @param  t the current thread
     * @return the map
     */
    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
```

在getMap中，是调用当期线程t，返回当前线程t中的一个成员变量threadLocals。继续跳到Thread内部查看threadLocals成员变量：

```java
    /* ThreadLocal values pertaining to this thread. This map is maintained
     * by the ThreadLocal class. */
    ThreadLocal.ThreadLocalMap threadLocals = null;
```
实际上就是一个ThreadLocalMap，这个类型是ThreadLocal类的一个内部类，我们继续查看ThreadLocalMap的实现：

```java
static class ThreadLocalMap {

        /**
         * The table, resized as necessary.
         * table.length MUST always be a power of two.
         */
        private Entry[] table;

        /**
         * The entries in this hash map extend WeakReference, using
         * its main ref field as the key (which is always a
         * ThreadLocal object).  Note that null keys (i.e. entry.get()
         * == null) mean that the key is no longer referenced, so the
         * entry can be expunged from table.  Such entries are referred to
         * as "stale entries" in the code that follows.
         */
        static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
}
```

可以看到ThreadLocalMap内部维护了一个Entry数组table，table采用hash进行索引插入，在内部以开放地址法解决hash碰撞问题。table可以看做一个hashmap，以ThreadLocal的threadLocalHashCode变量作为键值，限于篇幅不再赘述，有兴趣的可以看看源码。Entry类继承了WeakReference，并且使用ThreadLocal作为键值。然后再继续看setInitialValue方法的具体实现：

```java
    /**
     * Variant of set() to establish initialValue. Used instead
     * of set() in case user has overridden the set() method.
     *
     * @return the initial value
     */
    private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
        return value;
    }
```

这段代码做了如下工作：调用可重写的initialValue方法获取初始值，之后如果ThreadLocalMap不为空，就设置键值对，为空，再创建Map，看一下createMap的实现：

```java
    /**
     * Create the map associated with a ThreadLocal. Overridden in
     * InheritableThreadLocal.
     *
     * @param t the current thread
     * @param firstValue value for the initial entry of the map
     */
    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }
```

至此，ThreadLocal如何为每个线程创建变量的副本的步骤已经明了。首先，在每个线程Thread内部有一个ThreadLocal.ThreadLocalMap类型的成员变量threadLocals，这个threadLocals就是用来存储实际的变量副本的，内部由名为table的Entry数组维护，Entry的键值为当前ThreadLocal变量，value为变量副本（即T类型的变量）。初始时，在Thread里面，threadLocals为空，当通过ThreadLocal变量调用get()方法或者set()方法，就会对Thread类中的threadLocals进行初始化，并且以当前ThreadLocal变量为键值，以ThreadLocal要保存的副本变量为value，存到threadLocals。然后在当前线程里面，如果要使用副本变量，就可以通过get方法在threadLocals里面查找。

## ThreadLocal原理图

为了更清晰的认识其中的结构，我绘制了一幅原理图：

<img src="{{site.cdnurl}}/img/post/2016/ThreadLocal.svg" alt="SVG" style="background-color:white">

## 小结

* 实际的通过ThreadLocal创建的副本是存储在每个线程自己的threadLocals中的
* threadLocals(ThreadLocalMap)的键值之所以为ThreadLocal对象是因为每个线程中可有多个threadLocal变量，例如上图的ThreadLocal A/B/C/D
* 在进行get之前，必须先set，否则会报空指针异常；
* 如果想在get之前不需要调用set就能正常访问的话，必须重写initialValue()方法。

**补充：**

在Java8中增加了一个ThreadLocal的工厂方法：

```java
    /**
     * Creates a thread local variable. The initial value of the variable is
     * determined by invoking the {@code get} method on the {@code Supplier}.
     *
     * @param <S> the type of the thread local's value
     * @param supplier the supplier to be used to determine the initial value
     * @return a new thread local variable
     * @throws NullPointerException if the specified supplier is null
     * @since 1.8
     */
    public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
        return new SuppliedThreadLocal<>(supplier);
    }
```

此方法通过传入Supplier生成函数给SuppliedThreadLocal类，可以方便地构造出重写了initialValue方法的子类。SuppliedThreadLocal类实现如下：

```java
    /**
     * An extension of ThreadLocal that obtains its initial value from
     * the specified {@code Supplier}.
     */
    static final class SuppliedThreadLocal<T> extends ThreadLocal<T> {

        private final Supplier<? extends T> supplier;

        SuppliedThreadLocal(Supplier<? extends T> supplier) {
            this.supplier = Objects.requireNonNull(supplier);
        }

        @Override
        protected T initialValue() {
            return supplier.get();
        }
    }
```

到此，ThreadLocal类介绍完毕，代码虽然有点绕，不过结合原理图还是比较容易理解的，其本质就是以空间换时间，只要记住这一点就行了。
