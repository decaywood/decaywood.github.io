---
layout:     post
random-img: true
title:      博客与我, 功能迭代中的一些心历路程(持续更新)
subtitle:   Blog & Me -- Some of My Experience for Iteration
date:       2016-01-02 11:04:13
author:     decaywood
hot:        true
description: 使用jekyll搭建Github博客
keywords: jekyll,JavaScript,博客搭建
tags:
    - 总结
    - 博客搭建
    - JavaScript
    - jekyll
---

<b>致谢: [Hux blog 黄玄](http://huangxuan.me/)</b>

作为一个搞技术的，没有自己的技术博客好像有点说不过去，况且也就是这个原因，有时候好不容易获得的技术经验也随着时间的推移慢慢忘记，所以开个自己的技术博客的想法越来越强烈。一开始打算找一个技术网站开始自己的技术博客之路，调研过的技术网站也挺多的，比较出名的CSDN,博客园，51CTO等等都看过，虽然上面大牛很多，交流起来比较方便，但内心还是觉得这些不够Geek，首先可以定制的东西太少，其次界面也不够好看，虽然写技术博客而已也没必要拘泥于这些形式，不过我习惯对每件事都尽善尽美，如果决定做一件事，就一定要尽量做好，做细致，做到位！所以是忍受不了自己博客这么简陋的。于是目光渐渐放在了[GitHub Page](https://pages.github.com/)上面，GitHub Page有一个其他第三方博客网站无法匹敌的优势，那就是什么东西都可以定制，就像你自己的站点一样。

Github Page默认使用[Jekyll](http://jekyllrb.com/)来把代码生成为静态页面。另外，Jekyll的模版机制非常好用，如果你有面向对象基础，你会发现Jekyll的机制有点像类继承，HTML页面可以像类一样有层次关系了，并且在层次关系中可以共用上下文。这样的好处就是大幅提高建站效率。Jekyll配合GitHub 的版本控制，简直完美！

选好站点后，接下来就是下载模版了，jekyll提供一些官方的模板，虽然页面漂亮，但是功能非常欠缺，可以说是非常简陋！不过通过Github，可以找找别人通过优化的模板。我下载的是一个中国传媒大学的学生写的[模版](https://github.com/Huxpro/huxpro.github.io)，他审美不得不说真的很棒，果然是搞艺术的！大概看了一下，非常满意，花了一天时间研究源码，做的比较细致，响应式的设计，对移动端支持也不错！不过还是有些地方不是很满意。

现在具体说说有哪些我不满意的地方吧：

* [没有文章自动目录生成功能](#1)
* [没有夜间模式](#2)
* [没有优化资源加载时间](#3)
* [JavaScript代码分离不够彻底](#4)

<b id="1">没有文章自动目录生成功能</b>

这个不光此模板没有，很多博客网站都没有，也是我放弃在技术网站搭博的主因，这算是一个痛点吧，我觉得这应该算是很实用的功能吧。虽然中国传媒的这位同学通过手写业内跳转实现了这个功能，但毕竟是手写，俗话说一分钟以内搞不定的事情你不弄成自动化的你好意思说你是Geek？所以果断在源码中添加了如下算法：

```javascript
/*  generate TOC */
if($('#toc').length > 0) {
    //step3：将解析好的树形结构转换为嵌套形标题
    var makeTitle = function (root) {
        var element = root._index == -1 ? $('<div></div>') : $('<li></li>');
        if(root._index != -1) {
            var href = $('<a></a>').attr('href', root.ref).text(root.text);
            element.append(href);
        }
        //href.click(clickHandler);
        var children = root.children;
        if(children.length > 0) {
            var list = $('<ul></ul>');
            for (var i = 0; i < children.length; i++) {
                var childEle = children[i];
                list.append(makeTitle(childEle));
            }
            element.append(list);
        }
        return element;
    };
    //step2：收集到的标题标签由顺序结构按标题层级转换成树形结构
    var wrap = function (data) {
        var map = {'-1':{
            '_index' : -1,
            'children' : []
        }};
        for(var i = 0; i < data.length; i++) {
            var title = data[i];
            var ref = $(title).attr('id');
            var text = $(title).text();
            var obj = {
                'ref' : '#' + ref,
                'text' : text,
                '_index' : title._index,
                'children' : []
            };
            map[obj._index] = obj;
            map[obj._index - 1].children.push(obj);
        }
        return makeTitle(map[-1]);
    };
    //step1：收集HTML里面的标题标签
    $(document).ready(function () {
        var title_table = ['h2', 'h3', 'h4', 'h5', 'h6'];
        var postContainer = $('.post-container');
        if(postContainer.length > 0) {
            var children = [];
            postContainer.children().each(function () {
                var that = $(this);
                for(var i = 0; i < title_table.length; i++) {
                    var index = title_table[i];
                    if(that.is(index)) {
                        that._index = i;
                        children.push(that);
                    }
                }
            });
            var wrapper = wrap(children);
            $('#toc').after(wrapper);
        }
    });
}
```
要使用自动生成标题功能只需要在文章中加入id为toc的任意一个标签比如```<b id="toc">目录</b>```作为锚点就行了，程序会在页面加载好后自动生成可跳转的目录列表挂靠在锚点下面，非常方便。

<b id="2">没有夜间模式</b>

这个功能是我从网易新闻IOS客户端上舶过来的，我觉得这个功能相当实用，结果各大博客网站基本没有，要不就是单一的darcular风格，不能黑白切换，不能忍！果断写一个。代码就不贴了，实际就是将定位css与配色css进行分离，然后配色css分成两套，通过js切换即可。这里需要注意的是定位与配色必须分开，不分开的化进行主题切换会发生抖动，影响用户体验。除此之外，由于Github只能存放静态页面，所以没有会话之类的概念，假设用户设值为夜间模式，跳转到站内其他页面后又会重新变为默认的日间模式，这里使用了cookie存储当前主题，这样一次设置后，无论怎样跳转都会是当前设置的主题。

<b id="3">没有优化资源加载时间</b>

这个模板大量使用了大图背景增加视觉冲击，这也是我喜欢这个风格的原因之一。不过，为了保证大屏幕的清晰度，背景图size偏大，像Github这种代码管理网站IO性能一般都不是很高，然而这还是国外网站，IO速度可以想象，于是我将所有体积较大的静态文件转到了国内比较专业的[七牛运存储](http://www.qiniu.com/)来实现资源加速，js库也使用了Bootstrap网维护的CDN加速，网站整体加载速度提升了将近一倍。

<b id="4">JavaScript代码分离不够彻底</b>

可能作者是出于让js代码可以读取HTML页面上下文的目的比如百度统计的ID，他将部分js代码嵌入了HTML页面，这种混乱的编码我当然不能忍！但要读取上下文参数怎么办？很简单，只要在引入的script标签上面加一段全局变量代码就行了，不过为了防止与库的变量混淆，最好将自己的js文件script标签和全局变量代码段放在footer的最底层。


总的来说，这个博客自上线以来就一直细心的维护着，从一开始的一个简单的Jekyll模版，到现在拥有各种人性化的功能，中途花了不少精力。不过看着自己的博客慢慢变得个性与智能，内心还是颇有成就感的！

近期更新:

* 增加了背景响应式效果,鼠标移动页面会有对应反馈

* 随着博客特效以及功能越来越复杂,js文件越来越庞大,故对js文件进行了拆分,由grunt进行自动化合并以及uglify

* 移除了一些冗余的库