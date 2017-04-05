---
layout:     post
random-img: true
title:      Epoll 对IO多路复用所做的优化总结
subtitle:   The optimization of IO multiplexing by Epoll
date:       2017-04-2 15:30:32
author:     decaywood
description: 本文总结了epoll相对select、poll的性能优势
keywords: Linux,epoll,select,poll,性能
tags:
    - Linux
---

先看一下 Linux C 库中的 epoll API

```
int epoll_create(int size);  
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);  
int epoll_wait(int epfd, struct epoll_event *events,int maxevents, int timeout);
```

epoll\_create会建立一个epoll对象。内核在内存中创建了一个新的i-node并打开文件描述，随后在调用进程中为打开的这个文件描述分配一个新的文件描述符。同epoll实例兴趣列表相关联的是打开的文件描述，而不是epoll文件描述符。参数size是内核保证能够正确处理的最大句柄数，多于这个最大数时内核就不保证效果了。

epoll\_ctl可以操作上面建立的epoll，例如，将刚建立的socket加入到epoll中让其监控，或者把 epoll正在监控的某个socket句柄移出epoll，不再监控它等等。

epoll\_wait在调用时，在给定的timeout时间内，当在监控的所有句柄中有事件发生时，就返回用户态的进程。而每次调用select()和poll()时，内核必须检查所有在调用中指定的文件描述符。与之相反，当通过epoll\_ctl()指定了需要监视的文件描述符时，内核会在与打开的文件描述上下文相关联的列表中记录描述符。之后每当执行IO操作使得文件描述符成为就绪状态时，内核就在epoll描述符的就绪列表中添加一个元素。（单个打开的文件描述上下文中的一次IO事件可能导致与之相关的多个描述符成为就绪态）之后的epoll\_wait()调用从就绪列表中简单地取出这些元素。此外，调用select()和poll()时，需要传递一个标记了所有待监视的文件描述符的数据结构给内核，调用返回时，内核将修改进入就绪态的文件描述符对应的数据结构然后再传给我们。与之相反，在epoll中我们使用epoll\_ctl()在内核空间中建立一个数据结构，该数据结构会将待监视的文件描述符都记录下来。一旦这个数据结构建立完成，稍后每次调用epoll\_wait()时就不需要再传递任何与文件描述符有关的信息给内核了，而调用返回的信息只包含那些已经处于就绪态的描述符。并且，epoll使用了内存映射（mmap）技术，这样便彻底省掉了这些文件描述符在系统调用时复制的开销。（而无论select()还是poll()，我们必须对返回的数据结构做检查，以此找出N个文件描述符中有哪些是处于系统就绪态的。但是，通过一些测试得出的结果表明，这些额外的步骤所花费的时间同系统调用监视N个文件描述符所花费的时间相比就显得微不足道了）

从上面的调用方式就可以看到epoll比select、poll的优越之处：因为后者每次调用时都要传递你所要监控的所有socket给select、poll系统调用，这意味着需要将用户态的socket列表copy到内核态，如果以万计的句柄会导致每次都要copy几十几百KB的内存到内核态，非常低效。而我们调用epoll\_wait时就相当于以往调用select、poll，但是这时却不用传递socket句柄给内核，因为内核已经在epoll\_ctl中拿到了要监控的句柄列表。

所以，实际上在你调用epoll\_create后，内核就已经在内核态开始准备帮你存储要监控的句柄了，每次调用epoll\_ctl只是在往内核的数据结构里塞入新的socket句柄。

在内核里，一切皆文件。所以，epoll向内核注册了一个文件系统，用于存储上述的被监控socket。当你调用epoll\_create时，就会在这个虚拟的epoll文件系统里创建一个file结点。当然这个file不是普通文件，它只服务于epoll。

epoll在被内核初始化时（操作系统启动），同时会开辟出epoll自己的内核高速cache区，用于安置每一个我们想监控的socket，这些socket会以红黑树的形式保存在内核cache里，以支持快速的查找、插入、删除。这个内核高速cache区，就是建立连续的物理内存页，然后在之上建立slab层，简单的说，就是物理上分配好你想要的size的内存对象，每次使用时都是使用空闲的已分配好的对象。

```
static int __init eventpoll_init(void)  
{  
  
    /* Allocates slab cache used to allocate "struct epitem" items */  
    epi_cache = kmem_cache_create("eventpoll_epi", sizeof(struct epitem),  
            0, SLAB_HWCACHE_ALIGN|EPI_SLAB_DEBUG|SLAB_PANIC,  
            NULL, NULL);  
  
    /* Allocates slab cache used to allocate "struct eppoll_entry" */  
    pwq_cache = kmem_cache_create("eventpoll_pwq",  
            sizeof(struct eppoll_entry), 0,  
            EPI_SLAB_DEBUG|SLAB_PANIC, NULL, NULL);  
  
}
```

epoll的高效就在于，当我们调用epoll\_ctl往里塞入百万个句柄时，epoll\_wait仍然可以飞快的返回，并有效的将发生事件的句柄给我们用户。这是由于我们在调用epoll\_create时，内核除了帮我们在epoll文件系统里建了个file结点，在内核cache里建了个红黑树用于存储以后epoll\_ctl传来的socket外，还会再建立一个list链表，用于存储准备就绪的事件，当epoll\_wait调用时，仅仅观察这个list链表里有没有数据即可。有数据就返回，没有数据就sleep，等到timeout时间到后即使链表没数据也返回。所以，epoll\_wait非常高效。

而且，通常情况下即使我们要监控百万计的句柄，大多一次也只返回很少量的准备就绪句柄而已，所以，epoll\_wait仅需要从内核态copy少量的句柄到用户态而已，如何能不高效？！

那么，这个准备就绪list链表是怎么维护的呢？当我们执行epoll\_ctl时，除了把socket放到epoll文件系统里file对象对应的红黑树上之外，还会给内核中断处理程序注册一个回调函数，告诉内核，如果这个句柄的中断到了，就把它放到准备就绪list链表里。所以，当一个socket上有数据到了，内核把网卡上的数据处理好copy到内核中后就会把socket fd插入到准备就绪链表里了。执行epoll\_ctl时，如果增加socket句柄，则检查在红黑树中是否存在，存在立即返回，不存在则添加到树干上，然后向内核注册回调函数，用于当中断事件来临时向准备就绪链表中插入数据。执行epoll\_wait时立刻返回准备就绪链表里的数据即可。

一下是epoll同IO多路复用（select、poll）的性能对比：

下表展示了当我们使用poll()、select()以及epoll监视0到N-1的N个连续文件描述符时的结果（2.6.25版内核上）。从这个表格中，我们发现随着被监视的文件描述符数量的上升，poll()和select()的性能表现越来越差。与之相反，当N增长到很大值时，epoll性能表现几乎不会降低。（N值上升时，微小的性能下降可能是测试系统上的CPU cache达到了上限）

| 被监视的fd数量 | poll()所占用的CPU时间（秒） | select()所占用的CPU时间（秒） | epoll所占用的CPU时间（秒） |
| :---: |:---:| :---: | :---: |
| 10 | 0.61 | 0.73 | 0.41 |
| 100 | 2.9 | 3.0 | 0.42 |
| 1000 | 35 | 35 | 0.53 |
| 10000 | 990 | 930 | 0.66 |

最后看看epoll独有的两种模式LT和ET。无论是LT和ET模式，都适用于以上所说的流程。区别是，LT模式下，只要一个句柄上的事件一次没有处理完，会在以后调用epoll\_wait时次次返回这个句柄，而ET模式仅在第一次返回。

这件事怎么做到的呢？当一个socket句柄上有事件时，内核会把该句柄插入上面所说的准备就绪list链表，这时我们调用epoll\_wait，会把准备就绪的socket fd拷贝到用户态内存，然后清空准备就绪list链表，最后，epoll\_wait干了件事，就是检查这些socket，如果不是ET模式（就是LT模式的句柄了），并且这些socket上确实有未处理的事件时，又把该句柄放回到刚刚清空的准备就绪链表了。所以，非ET的句柄，只要它上面还有事件，epoll\_wait每次都会返回。而ET模式的句柄，除非有新中断到，即使socket上的事件没有处理完，也是不会次次从epoll\_wait返回的。