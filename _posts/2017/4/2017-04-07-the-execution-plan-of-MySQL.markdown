---
layout:     post
random-img: true
title:      如何理解 MySQL 的执行计划
subtitle:   How to Understand the Execution Plan of MySQL
date:       2017-04-07 21:17:30
author:     decaywood
description: MySQL 执行计划相关学习
keywords: MySQL,执行计划
tags:
    - 数据库
---

## MySQL的逻辑体系结构

<img src="{{site.cdnurl}}/img/post/2017/MySQL-Server-Structure.svg" alt="SVG" style="background-color:white">

最上层的服务并不是MySQL所独有的，大多数基于网络的客户端/服务器的工具都有类似的架构。比如连接处理、授权认证、安全等等。

第二层架构是MySQL比较有意思的部分。大多数MySQL的核心服务功能都在这一层，包括查询解析、分析、优化、缓存以及所有内置函数（例如：日期、时间、数学和加密函数），所有跨存储引擎的功能都在这一层实现：存储过程，触发器，视图等。

第三层包含了存储引擎。存储引擎负责MySQL中数据的存储和提取。和GNU/Linux下的各种文件系统一样，每个存储引擎都有它的优势和劣势。服务器通过API与存储引擎进行通信。这些接口屏蔽了不同存储引擎之间的差异，使得这些差异对上层的查询过程透明。存储引擎API包含十几个底层函数，用于执行诸如“开始一个事物”或者“根据主键提取一行记录”等操作。但存储引擎不会去解析SQL（注：InnoDB是一个例外，它会解析外键定义，因为MySQL服务器本身没有实现该功能），不同存储引擎之间也不会互相通信，而只是简单地响应上层服务器的请求。

### 连接管理与安全

每个客户端连接都会在服务器进程中拥有一个线程，这个连接的查询只会在这个单独的线程中执行，该线程只能轮流在某个CPU核心或者CPU中运行。服务器会负责缓存线程，因此不需要为每一个新建的连接创建或者销毁线程。（注：MySQL5.5或者更新的版本提供的一个API，支持线程池插件，可以使用池中少量的线程来服务大量的连接）。

当客户端（应用）连接到MySQL服务器时，服务器需要对其进行认证。认证基于用户名，原始主机信息和密码。如果使用了安全套接字（SSL）的方式连接，还可以使用X.509证书认证。一旦客户端连接成功，服务器会继续验证客户端是否具有某个特定查询的权限（例如，是否允许客户端对world数据库的Country表执行SELECT语句）。

### 优化与执行

MySQL会解析查询，并创建内部数据结构（解析树），然后对其进行各种优化，包括重写查询，决定表的读取顺序，以及选择合适的索引等。用户可以通过特殊的关键字提示（hint）优化器，影响它的决策过程。也可以请求优化器解释（explain）优化过程的各个因素，使用户可以知道服务器是如何进行优化决策的，并提供一个参考基准，便于用户重构查询和schema，修改相关配置，是应用尽可能高效运行。

优化器并不关心使用的是什么存储引擎，但存储引擎对于优化查询是有影响的。优化器会请求存储引擎提供容量或某个具体操作的开销信息，以及表数据的统计信息等。例如，某些存储引擎的某种索引，可能对一些特定的查询有优化。

对于SELECT语句，在解析查询之前，服务器会先检查查询缓存（Query Cache），如果能够在其中找到对应的查询，服务器就不必再执行查询解析、优化和执行的整个过程，而是直接返回查询缓存中的结果集。

### 查询的过程以及开销

查询的过程：从客户端到服务端，在服务器上进行解析，生成执行计划，执行，并返回结果给客户端，执行包括了大量为了检索数据到存储引擎的调用以及调用后的数据处理，包括排序，分组。

查询的开销：MySQL的解析，优化，锁等待，以及数据处理等，存储引用的API的调用。

## SQL标准的执行流程（select）

```
(8)  SELECT
(9)  DISTINCT
(11) <TOP_specification> <select_list>
(1)  FROM <left_table>
(3)  <join_type> JOIN <right_table>
(2)  ON <join_condition>
(4)  WHERE <where_condition>
(5)  GROUP BY <group_by_list>
(6)  WITH {CUBE ROLLUP}
(7)  HAVING <having_condition>
(10) ORDER BY <order_by_list>
```

1. FROM：对FROM子句中的前两个表执行笛卡尔积，生成虚拟表VT1
2. ON：对VT1应用ON筛选器。只有那些使\<join\_condition\>为真的行才被插入VT2
3. OUTER（JOIN）：如果指定了OUTER JOIN，保留表中未找到匹配的行将作为外部行添加到VT2，生成VT3。如果FROM子句包含两个以上的表，则对上一个联接生成的结果表和下一个表重复执行步骤1到步骤3，直到处理完所有的表为止
4. 对VT3应用WHERE筛选器。只有使\<where\_condition\>为TRUE的行才被插入VT4
5. GROUP BY：按GROUP BY 子句中的列列表对VT4中的行分组，生成VT5
6. CUBEROLLUP：把超组插入VT5，生成VT6。
7. HAVING：对VT6应用HAVING筛选器。只有使\<having\_condition\>为TRUE的组才会被插入VT7
8. SELECT：处理SELECT列表，产生VT8。
9. DISTINCT：将重复的行从VT8中移除，产生VT9
10. ORDER BY：将VT9中的行按ORDER BY子句中的列列表排序，生成一个有表（VC10）
11. TOP：从VC10的开始处选择指定数量或比例的行，生成表VT11，并返回给调用者

## SQL 中的 JOIN

<img src="{{site.cdnurl}}/img/post/2017/DB-Join-Diagram.svg" alt="SVG" style="background-color:white">

## nested loop join 算法（对连接的优化）

在MySQL中，只有一种 Join 算法，就是大名鼎鼎的 Nested Loop Join，他没有其他很多数据库所提供的 Hash Join，也没有 Sort Merge Join。顾名思义，Nested Loop Join 实际上就是通过驱动表的结果集作为循环基础数据，然后一条一条的通过该结果集中的数据作为过滤条件到下一个表中查询数据，然后合并结果。如果还有第三个参与 Join，则再通过前两个表的 Join 结果集作为循环基础数据，再一次通过循环查询条件到第三个表中查询数据，如此往复。

MySQL用一次扫描多次连接（single-sweep，multi-join）的方法来解决连接。这意味着MySQL从第一个表中读取一条记录，然后在第二个表中查找到对应的记录，然后在第三个表 中查找，依次类推。当所有的表都扫描完了，它输出选择的字段并且回溯所有的表，直到找不到为止，因为有的表中可能有多条匹配的记录下一条记录将从该表读取，再从下一个表开始继续处理。

## MySQL 执行计划的理解

**id：** 本次 select 的标识符。在查询中每个 select 都有一个顺序的数值。

**select\_type：**

* simple: 简单的 select （没有使用 union或子查询）
* primary: 最外层的 select。
* union: 第二层，在select 之后使用了 union。
* dependent union: union 语句中的第二个select，依赖于外部子查询
* subquery: 子查询中的第一个 select
* dependent subquery: 子查询中的第一个 subquery依赖于外部的子查询
* derived: 派生表 select（from子句中的子查询）

**table：**记录查询引用的表。

**type：**以下列出了各种不同类型的表连接，依次是从最好的到最差的：

SYSTEM > CONST > EQ\_REF > REF > RANGE > INDEX > ALL（不仅仅是连接，单表查询也会有）

* system：表只有一行记录（等于系统表）。这是 const 表连接类型的一个特例
* const：表中最多只有一行匹配的记录，它在查询一开始的时候就会被读取出来。由于只有一行记录，在余下的优化程序里该行记录的字段值可以被当作是一个恒定值。const表查询起来非常快，因为只要读取一次！const 用于在和 primary key 或unique 索引中有固定值比较的情形
* wq\_ref:从该表中会有一行记录被读取出来以和从前一个表中读取出来的记录做联合。与const类型不同的是，这是最好的连接类型。它用在索引所有部 分都用于做连接并且这个索引是一个primary key 或 unique 类型。eq\_ref可以用于在进行“=”做比较时检索字段。比较的值可以是固定值或者是表达式，表达示中可以使用表里的字段，它们在读表之前已经准备好了
* ref: 该表中所有符合检索值的记录都会被取出来和从上一个表中取出来的记录作联合。ref用于连接程序使用键的最左前缀或者是该键不是 primary key 或 unique索引（换句话说，就是连接程序无法根据键值只取得一条记录）的情况。当根据键值只查询到少数几条匹配的记录时，这就是一个不错的连接类型。 ref还可以用于检索字段使用=操作符来比较的时候。以下的几个例子中，MySQL将使用 ref 来处理ref\_table，和eq\_ref的区别是-用到的索引是否唯一性
* range：只有在给定范围的记录才会被取出来，利用索引来取得一条记录。range用于将某个字段和一个定值用以下任何操作符比较时：=、\<\>、\>、\>=、\<、\<=、is null、\<=\>、between、and 或 in，例子：
 * select * from tbl\_name where key\_column = 10; 
 * select * from tbl\_name where key\_column between 10 and 20; 
 * select * from tbl\_name where key\_column in (10,20,30); 
 * select * from tbl\_name where key\_part1= 10 and key\_part2 in (10,20,30);
* index：连接类型跟 all 一样，不同的是它只扫描索引树。它通常会比 all快点，因为索引文件通常比数据文件小。MySQL在查询的字段只是单独的索引的一部分的情况下使用这种连接类型
* all: 将对该表做全部扫描以和从前一个表中取得的记录作联合。这时候如果第一个表没有被标识为const的话就不大好了，在其他情况下通常是非常糟糕的。正常地，可以通过增加索引使得能从表中更快的取得记录以避免all

**possible\_keys：**possible\_keys字段是指 MySQL 在搜索表记录时可能使用哪个索引。注意，这个字段完全独立于 explain 显示的表顺序。这就意味着 possible\_keys 里面所包含的索引可能在实际的使用中没用到。如果这个字段的值是null，就表示没有索引被用到。这种情况下，就可以检查 where子句中哪些字段那些字段适合增加索引以提高查询的性能。就这样，创建一下索引，然后再用 explain 检查一下。想看表都有什么索引，可以通过 show index from tbl\_name 来看。

**key：**key字段显示了 MySQL 实际上要用的索引。当没有任何索引被用到的时候，这个字段的值就是null。想要让 MySQL 强行使用或者忽略在 possible\_keys 字段中的索引列表，可以在查询语句中使用关键字 force index、 use index 或 ignore index。

**key\_len：**key\_len 字段显示了MySQL使用索引的长度。当 key 字段的值为 null时，索引的长度就是 null。注意，key\_len的值可以告诉你在联合索引中 MySQL 会真正使用了哪些索引。

**ref：**ref 字段显示了哪些字段或者常量被用来和 key 配合从表中查询记录出来。

**rows：**rows 字段显示了 MySQL 认为在查询中应该检索的记录数。MySQL 认为的得到结果需要读取的记录数，不是返回的记录数。

**extra：**

* not exists：mysql 在查询时做一个 left join 优化时，当它在当前表中找到了和前一条记录符合 left join 条件后，就不再搜索更多的记录了。下面是一个这种类型的查询例子：select * from t1 left join t2 on t1.id=t2.id where t2.id is null;假使 t2.id 定义为 not null。这种情况下，mysql将会扫描表 t1并且用 t1.id 的值在 t2 中查找记录。当在 t2中找到一条匹配的记录时，这就意味着 t2.id 肯定不会都是 null，就不会再在 t2 中查找相同 id 值的其他记录了。也可以这么说，对于 t1 中的每个记录，mysql 只需要在t2 中做一次查找，而不管在 t2 中实际有多少匹配的记录。
* range checked for each record (index map)：mysql没找到合适的可用的索引。取代的办法是，对于前一个表的每一个行连接，它会做一个检验以决定该使用哪个索引（如果有的话），并且使用这个索引来从表里取得记录。这个过程不会很快，但总比没有任何索引时做表连接来得快。
* using filesort：mysql 需要额外的做一遍排序从而以排好的顺序取得记录。排序程序根据连接的类型遍历所有的记录，并且将所有符合 where 条件的记录的要排序的键和指向记录的指针存储起来。这些键已经排完序了，对应的记录也会按照排好的顺序取出来。
* using index：字段的信息直接从索引树中的信息取得，而不再去扫描实际的记录。这种策略用于查询时的字段是一个独立索引的一部分。
* using temporary：mysql需要创建临时表存储结果以完成查询。这种情况通常发生在查询时包含了  group by 和 order by 子句，它以不同的方式列出了各个字段。
* using where：where 子句将用来限制哪些记录匹配了下一个表或者发送给客户端。除非你特别地想要取得或者检查表种的所有记录，否则的话当查询的 extra 字段值不是 using where 并且表连接类型是 all 或 index 时可能表示有问题。如果你想要让查询尽可能的快，那么就应该注意 extra 字段的值为using filesort 和 using temporary 的情况。 




