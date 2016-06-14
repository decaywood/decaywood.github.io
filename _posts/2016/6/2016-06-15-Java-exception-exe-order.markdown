---
layout:     post
random-img: true
title:      关于Java异常时return语句的执行顺序
subtitle:   About The Order of Execution of Return When Exceptions Throwed
date:       2016-06-15 00:31:16
author:     decaywood
description: 关于Java异常时return语句的执行顺序
keywords: Java,异常,try,catch,finally
tags:
    - Java
---

* finally代码块的语句在return之前一定会得到执行

* 如果try块中有return语句，finally代码块没有return语句，那么try块中的return语句在返回之前会先将要返回的值保存，之后执行finally代码块，最后将保存的返回值返回，finally代码块虽然对返回值进行修改也不影响返回值，因为要返回的值在执行finally代码块之前已经保存了，最终返回的是保存的旧值。

* 如果try块和finally块都有返回语句，那么虽然try块中返回值在执行finally代码块之前被保存了，但是最终执行的是finally代码块的return语句，try块中的return语句不再执行。

* catch块和try块类似，会在执行finally代码块执行前保存返回值的结果，finally语句中有return语句则执行finally的return语句，没有则执行catch块中的return语句，返回之前的保存值。