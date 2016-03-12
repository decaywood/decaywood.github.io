---
layout:     post
random-img: true
title:      Git 的 cherry-pick 功能
subtitle:   Cherry-pick of Git
date:       2016-03-09 21:55:23
author:     decaywood
description: 使用 Git cherry-pick 功能的一个总结
keywords: git, cherry-pick
tags:
    - 版本控制
---

简而言之，cherry-pick就是从不同的分支中捡出一个单独的commit，并把它和你当前的分支合并。如果你以并行方式在处理两个或以上分支，你可能会发现一个在全部分支中都有的bug。如果你在一个分支中解决了它，你可以使用cherry-pick命令把它commit到其它分支上去，而不会弄乱其他的文件或commit。

以我目前做的项目为例，现在有4个开发者维护着四个分支，以自己的用户名命名，开发出一个特性后定时合并到dev分支。并且规定各自分支不能将合并后的dev分支代码合并回自己分支，以免发生混乱。但是这样就有个问题，比如A开发出一个特性，B的后续特性需要依赖A开发出来的特性，由于B不能合并远程的dev分支，故B是没有办法获取A开发的特性的。

这个时候，cherry-pick就起作用了，假设dev分支上A最近一次提交为hash-1，B就可以在自己分支上执行```git cherry-pick hash-1```来获取A最近一次提交更新的文件，如果没有冲突，B的分支将自动进行一次与A一致的提交，否则进行合并后提交。这时，B就可以使用A开发的特性了。

**IntelliJ Idea下的界面**

<img src="{{site.cdnurl}}/img/post/2016/Git-branch-screenshot.png" alt="SVG" style="background-color:white">

如图所示，在Author那栏，有两行作者名字有个星号，这代表cherry-pick过来的文件的原始作者。在这两次提交的message信息中可以看到当前提交所依赖的原始作者的提交的hash值。

**后记**

在平常开发中，一定要善于使用Git提供的各种功能，这样有助于提升团队协同开发的效率。俗话说：工欲善其事,必先利其器，就是这个道理。

最后扯一句题外话，网上很多人不屑于使用各种工具，以为自己徒手开发就很牛逼了。个人认为不是这样的，现代程序的一个显著特点就是复杂度高，纵使你技术再好，也是很难单打独斗完成一个完整的项目的。如果不能与其他人很好的合作，及时地出产品或者成果，那么技术本身也就失去了意义。

对于团队合作，我不敢说没有版本控制，项目就一定进行不下去，但可以肯定的是，在版本控制的协助下，团队整体效率会有极大的提高的。