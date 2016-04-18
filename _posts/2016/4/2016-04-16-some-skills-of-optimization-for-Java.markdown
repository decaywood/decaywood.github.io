---
layout:     post
random-img: true
title:      Java在代码层面的一些优化技巧
subtitle:   some skills of optimization for Java
date:       2016-04-16 16:36:21
author:     decaywood
description: 此文将介绍一些Java在代码层面的一些优化技巧，也是对自己编码时遇到的一些坑以及学习时想到的一些思路的一次总结。
keywords: Java,性能优化
tags:
    - Java
    - 总结
---

程序的结构是否标准，代码的细节是否值得推敲，系统的可维护性是否良好。这些方面对于一个产品在后期投入人力成本有直接关系。所以，习惯良好的程序员在程序后期维护上面比码农程序员有着更多的选择余地，不会因为改了某个需求而将宝贵的时间大把浪费在修复bug或者打补丁上。所以，优秀的coder都应该尽可能的让自己的代码更加敏捷、极致。此文将介绍一些Java在代码层面的一些优化技巧，也是对自己编码时遇到的一些坑以及学习时想到的一些思路的一次总结。

## 列表遍历方式的选择

一般，Java列表有两种遍历写法：fori循环以及forEach循环（Java8提供了第三种方式：流式循环），具体写法如下：


```java
/**
 * @author: decaywood
 * @date: 2016/04/16 13:41
 */
public class Loop {

    //fori遍历
    private static void foriLoop(List<Integer> names) {
        for (int i = 0; i < names.size(); i++) {
            Integer integer = names.get(i);
            // TODO
        }
    }

    //forEach遍历
    private static void forEachLoop(List<Integer> names) {
        for (Integer integer : names) {
            // TODO
        }
    }

    //流式遍历
    private static void streamLoop(List<Integer> names) {
        names.stream().forEach(integer -> {
            // TODO
        });
    }
}
```

forEach写法执行的时候 会为这个抽象列表创建一个迭代器，而fori写法则直接使用 get(i) 来获取元素，相对于forEach遍历省去了迭代器的开销。流式遍历底层也是使用迭代器来遍历，由于使用函数式接口，底层实现相对前两种遍历方式会引入很多额外的数据结构。所以，除了迭代之外，附加的开销毫无疑问位于其他两种遍历方式之上。

下面我们添加一个计时器来测试三种遍历方式的耗时：

```java
/**
 * @author: decaywood
 * @date: 2016/04/16 13:41
 */
public class Loop {

    private static void timer(Consumer<List<Integer>> func, List<Integer> param, String id) {
        long start = System.nanoTime();
        func.accept(param);
        long end = System.nanoTime();
        System.out.println(id + " cost: " + (end - start) + " ns");
    }

    private static void foriLoop(List<Integer> names) {...}

    private static void forEachLoop(List<Integer> names) {...}

    private static void streamLoop(List<Integer> names) {...}

    public static void main(String[] args) {
        List<Integer> names = new ArrayList<>(10000);
        for (int i = 0; i < 10000; i++) {
            names.add(i);
        }
        timer(Loop::foriLoop, names, "foriloop");
        timer(Loop::forEachLoop, names, "forEachloop");
        timer(Loop::streamLoop, names, "streamLoop");
    }
    
}
```

运行结果如下：

```
foriloop cost: 994387 ns
forEachloop cost: 1113767 ns
streamLoop cost: 3161550 ns
```

这个结果是符合预期的，fori循环由于没有迭代器的初始化，相较于forEach循环稍快一些，而流式循环由于底层支持lambda表达式引入了复杂的实现，所以慢了很多。不过三者耗时仍然在一个数量级上。

然而，列表的遍历方式实际上还是需要一些权衡的。forEach循环以及流式循环使用了迭代器，保证了在获取元素的时候的时间复杂度是 O(1)（使用了 getNext() 和 hasNext() 方法），最终的时间复杂度为 O(n) 。但是对于fori循环，循环里每次调用 names.get(i) 的时候是跟具体实现机制相关的，比如List的实现为LinkedList，那么 get(i) 的时间复杂度为 O(n)，那么对于fori循环来说,整个循环最终的时间复杂度就是 O(n^2) 。但如果List的实现是ArrayList，那 get(i) 方法的时间复杂度就是 O(1)了。所以在决定使用哪一种遍历的方式的时候，我们需要考虑列表的底层实现，列表的平均长度以及所使用的内存。

如果将List实现改为LinkedList，运行结果如下：

```
foriloop cost: 47471574 ns
forEachloop cost: 1521451 ns
streamLoop cost: 2374256 ns
```

foriloop耗时高了一个数量级。

**三种实现的选择**

由于迭代器会造成额外的内存开销，如果List的底层实现能确定为ArrayList，且程序对于内存要求比较高，那么foriloop遍历实现比较合适。否则，为了可伸缩性考虑则选择forEach实现。如果你需要更高的可拓展性，比如函数式编程的支持，那么流式遍历是更好的选择，它能让你程序的可拓展性达到极致，对于额外的那些开销可能是值得的。除此之外，流式遍历提供底层并行迭代的支持。

## 合理设置集合初始大小

Java集合在容量到达阈值时会进行扩容操作，以HashMap为例子。HashMap 实例有两个影响它性能的因素：初始大小和负载因子。当HashMap的大小达到初始大小和加载因子的乘积的时候，容量到达阈值，HashMap会进行扩容操作。如果在一个HashMap 实例里面要存储多个映射关系时，我们需要设置足够大的初始化大小以便更有效地存储映射关系而不是让HashMap自动增长，造成性能瓶颈。

**实际场景**

有时候我们为了降低读操作的时间复杂度，会将List元素通过HashMap来进行映射。将 HashMap 初始化至预期的大小可以避免扩容所带来的开销。初始化大小可以设置为输入的数组大小除以默认加载因子的结果值。

```java
/**
 * @author: decaywood
 * @date: 2016/04/16 15:09
 */
public class InitialSize {

    private void originMapping(List<User> users) {
        HashMap<String, Object> mapping = new HashMap<>();
        for (User user : users) {
            mapping.put(user.getName(), user);
        }
    }

    private void optimizedMapping(List<User> users) {
        int initSize = (int) (users.size() / 0.75f);
        HashMap<String, Object> mapping = new HashMap<>(initSize);
        for (User user : users) {
            mapping.put(user.getName(), user);
        }
    }

}
```

## 延迟表达式的计算

在Java中，如果调用一个方法时传入表达式作为参数的话，都会先计算这个表达式（从左到右）。这个规则会导致一些不必要的操作。考虑到下面一个场景：使用ComparisonChain比较两个 Foo 对象。使用这样的比较链条的一个好处就是在比较的过程中只要一个 compare 方法返回了 false 整个比较就结束了，避免了许多无谓的比较。例如现在这个场景中的要比较的对象最先考虑他们的score, 然后是 position, 最后就是 bar 这个属性了：

```java
/**
 * @author: decaywood
 * @date: 2016/04/16 15:35
 */
public class Foo {
    private float score;
    private int position;
    private Bar bar;

    public boolean compareTo(Foo other) {
        return ComparisonChain.start().
                compare(score, other.getScore()).
                compare(position, other.getPosition()).
                compare(bar.toString(), other.getBar().toString()).
                result;
    }
}
```

但是上面这种实现方式总是会先生成两个 String 对象来保存 bar.toString() 和other.getBar().toString() 的值，即使这两个字符串的比较可能根本不会触发。为了避免这样的开销，可以为Bar 对象实现一个 comparator (假设compare方法有三参数的重载版本)：

```java
/**
 * @author: decaywood
 * @date: 2016/04/16 15:35
 */
public class Foo {
    private float score;
    private int position;
    private Bar bar;
    private final Comparator<Bar> BAR_COMPARATOR =
    (a, b) -> a.toString().compareTo(b.toString())
    
    public int compareTo(Foo other) {
        return ComparisonChain.start().
                compare(score, other.getScore()).
                compare(position, other.getPosition()).
                compare(bar, other.getBar(), BAR_COMPARATOR).
                result();
    }
}
```

## 提前编译正则表达式

字符串的操作在Java中算是开销比较大的操作。还好Java提供了一些工具让正则表达式尽可能地高效。动态的正则表达式在实践中比较少见。在接下来要举的例子中，每次调用String.replaceAll() 都包含了一个常量模式应用到输入值中去。因此我们预先编译这个模式可以节省CPU和内存的开销。

```java
/**
 * @author: decaywood
 * @date: 2016/04/16 16:03
 */
public class Regex {

    private String originReplace(String term) {
        return term.replaceAll(regex, replacement);
    }

    private final Pattern pattern = Pattern.compile(regex);
    
    private String optimizedReplace(String term) {
        return pattern.matcher(term).replaceAll(replacement);
    }
    
}
```

## 缓存热点数据

如果有大量重复地读操作，我们可以通过缓存来减少数据库操作或者其他耗时计算来提升程序的整体性能。比如LRUCache是一个很好的选择。

## 善于利用 String 的  intern()方法

intern方法的本质其实就是缓存，其内实现大致如下：调用intern方法时，首先通过equals方法检查String常量池中是否有目标字符串，如果没有，则常量池中添加目标字符串在堆中的引用。（以Java7及以上版本为准，常量池的符号引用存储在直接内存中）

然而需要注意，使用这个方法有一定的风险，你不能设置最多可容纳的元素数目。因此，如果这些intern的字符串没有限制（比如字符串代表着一些唯一的id），那么它会让堆内存占用飞速增长直到溢出。所以这里使用LRUCache人工维护比较合理。