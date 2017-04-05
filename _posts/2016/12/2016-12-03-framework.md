---
layout:     post
random-img: true
title:      Java 开源实用类库排名
subtitle:   The Rank of Java OpenSource Lib
date:       2016-12-03 9:51:49
author:      decaywood
description: 本文中列出来的类及方法都是经过大量实践的常用类库及方法
keywords: 开源
tags:
    - Java
    - 框架
    - 总结
---

在Java中，有很多比较实用的类库，他们通常都定义了一系列具有常见功能的方法。本文总结了最常用的Java中的实用类以及他们的最常用的方法。无论是类和类中方法都是按照流行程度来排序的。

本文中列出来的类及方法都是经过大量实践的常用类库及方法，我们可以直接拿过来用。当然，这些方法实现的功能我们自己都能实现，但是既然已经有很成熟的方法可以供我们使用了，那么就无需自己定义了。很多类和方法通过他们的名字其实可以理解出具体是做什么的。每个方法都有一个链接，可以查看他们在开源代码中具体是如何使用的。

以下列表是通过分析50K的开源项目得出来的。

## [org.apache.commons.io.IOUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.io.IOUtils)

*   [closeQuietly ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=closeQuietly)
*   [toString ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=toString)
*   [copy ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=copy)
*   [toByteArray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=toByteArray)
*   [write ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=write)
*   [toInputStream ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=toInputStream)
*   [readLines ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=readLines)
*   [copyLarge ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=copyLarge)
*   [lineIterator ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=lineIterator)
*   [readFully ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.IOUtils&method=readFully)

## [org.apache.commons.io.FileUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.io.FileUtils)

*   [deleteDirectory ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=deleteDirectory)
*   [readFileToString ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=readFileToString)
*   [deleteQuietly ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=deleteQuietly)
*   [copyFile ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=copyFile)
*   [writeStringToFile ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=writeStringToFile)
*   [forceMkdir ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=forceMkdir)
*   [write ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=write)
*   [listFiles ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=listFiles)
*   [copyDirectory ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=copyDirectory)
*   [forceDelete ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FileUtils&method=forceDelete)

## [org.apache.commons.lang.StringUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang.StringUtils)

*   [isBlank ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=isBlank)
*   [isNotBlank ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=isNotBlank)
*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=isEmpty)
*   [isNotEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=isNotEmpty)
*   [equals ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=equals)
*   [join ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=join)
*   [split ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=split)
*   [EMPTY](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=EMPTY)
*   [trimToNull ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=trimToNull)
*   [replace ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringUtils&method=replace)

## [org.apache.http.util.EntityUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.http.util.EntityUtils)

*   [toString ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.util.EntityUtils&method=toString)
*   [consume ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.util.EntityUtils&method=consume)
*   [toByteArray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.util.EntityUtils&method=toByteArray)
*   [consumeQuietly ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.util.EntityUtils&method=consumeQuietly)
*   [getContentCharSet ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.util.EntityUtils&method=getContentCharSet)

## [org.apache.commons.lang3.StringUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang3.StringUtils)

*   [isBlank ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=isBlank)
*   [isNotBlank ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=isNotBlank)
*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=isEmpty)
*   [isNotEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=isNotEmpty)
*   [join ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=join)
*   [equals ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=equals)
*   [split ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=split)
*   [EMPTY](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=EMPTY)
*   [replace ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=replace)
*   [capitalize ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringUtils&method=capitalize)

## [org.apache.commons.io.FilenameUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.io.FilenameUtils)

*   [getExtension ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=getExtension)
*   [getBaseName ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=getBaseName)
*   [getName ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=getName)
*   [concat ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=concat)
*   [removeExtension ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=removeExtension)
*   [normalize ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=normalize)
*   [wildcardMatch ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=wildcardMatch)
*   [separatorsToUnix ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=separatorsToUnix)
*   [getFullPath ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=getFullPath)
*   [isExtension ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.io.FilenameUtils&method=isExtension)

## [org.springframework.util.StringUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.springframework.util.StringUtils)

*   [hasText ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=hasText)
*   [hasLength ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=hasLength)
*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=isEmpty)
*   [commaDelimitedListToStringArray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=commaDelimitedListToStringArray)
*   [collectionToDelimitedString ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=collectionToDelimitedString)
*   [replace ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=replace)
*   [delimitedListToStringArray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=delimitedListToStringArray)
*   [uncapitalize ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=uncapitalize)
*   [collectionToCommaDelimitedString ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=collectionToCommaDelimitedString)
*   [tokenizeToStringArray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.springframework.util.StringUtils&method=tokenizeToStringArray)

## [org.apache.commons.lang.ArrayUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang.ArrayUtils)

*   [contains ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=contains)
*   [addAll ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=addAll)
*   [clone ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=clone)
*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=isEmpty)
*   [add ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=add)
*   [EMPTY_BYTE_ARRAY](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=EMPTY_BYTE_ARRAY)
*   [subarray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=subarray)
*   [indexOf ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=indexOf)
*   [isEquals ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=isEquals)
*   [toObject ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.ArrayUtils&method=toObject)

## [org.apache.commons.lang.StringEscapeUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang.StringEscapeUtils)

*   [escapeHtml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=escapeHtml)
*   [unescapeHtml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=unescapeHtml)
*   [escapeXml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=escapeXml)
*   [escapeSql ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=escapeSql)
*   [unescapeJava ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=unescapeJava)
*   [escapeJava ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=escapeJava)
*   [escapeJavaScript ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=escapeJavaScript)
*   [unescapeXml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=unescapeXml)
*   [unescapeJavaScript ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang.StringEscapeUtils&method=unescapeJavaScript)

## [org.apache.http.client.utils.URLEncodedUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.http.client.utils.URLEncodedUtils)

*   [format ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.client.utils.URLEncodedUtils&method=format)
*   [parse ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.http.client.utils.URLEncodedUtils&method=parse)

## [org.apache.commons.codec.digest.DigestUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.codec.digest.DigestUtils)

*   [md5Hex ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=md5Hex)
*   [shaHex ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=shaHex)
*   [sha256Hex ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=sha256Hex)
*   [sha1Hex ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=sha1Hex)
*   [sha ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=sha)
*   [md5 ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=md5)
*   [sha512Hex ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=sha512Hex)
*   [sha1 ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.codec.digest.DigestUtils&method=sha1)

## [org.apache.commons.collections.CollectionUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.collections.CollectionUtils)

*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=isEmpty)
*   [isNotEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=isNotEmpty)
*   [select ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=select)
*   [transform ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=transform)
*   [filter ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=filter)
*   [find ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=find)
*   [collect ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=collect)
*   [forAllDo ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=forAllDo)
*   [addAll ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=addAll)
*   [isEqualCollection ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.collections.CollectionUtils&method=isEqualCollection)

## [org.apache.commons.lang3.ArrayUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang3.ArrayUtils)

*   [contains ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=contains)
*   [isEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=isEmpty)
*   [isNotEmpty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=isNotEmpty)
*   [add ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=add)
*   [clone ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=clone)
*   [addAll ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=addAll)
*   [subarray ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=subarray)
*   [indexOf ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=indexOf)
*   [EMPTY_OBJECT_ARRAY](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=EMPTY_OBJECT_ARRAY)
*   [EMPTY_STRING_ARRAY](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.ArrayUtils&method=EMPTY_STRING_ARRAY)

## [org.apache.commons.beanutils.PropertyUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.beanutils.PropertyUtils)

*   [getProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=getProperty)
*   [setProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=setProperty)
*   [getPropertyDescriptors ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=getPropertyDescriptors)
*   [isReadable ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=isReadable)
*   [copyProperties ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=copyProperties)
*   [getPropertyDescriptor ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=getPropertyDescriptor)
*   [getSimpleProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=getSimpleProperty)
*   [isWriteable ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=isWriteable)
*   [setSimpleProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=setSimpleProperty)
*   [getPropertyType ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.PropertyUtils&method=getPropertyType)

## [org.apache.commons.lang3.StringEscapeUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.lang3.StringEscapeUtils)

*   [unescapeHtml4 ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=unescapeHtml4)
*   [escapeHtml4 ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeHtml4)
*   [escapeXml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeXml)
*   [unescapeXml ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=unescapeXml)
*   [escapeJava ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeJava)
*   [escapeEcmaScript ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeEcmaScript)
*   [unescapeJava ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=unescapeJava)
*   [escapeJson ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeJson)
*   [escapeXml10 ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.lang3.StringEscapeUtils&method=escapeXml10)

## [org.apache.commons.beanutils.BeanUtils](http://www.programcreek.com/java-api-examples/index.php?api=org.apache.commons.beanutils.BeanUtils)

*   [copyProperties ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=copyProperties)
*   [getProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=getProperty)
*   [setProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=setProperty)
*   [describe ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=describe)
*   [populate ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=populate)
*   [copyProperty ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=copyProperty)
*   [cloneBean ( )](http://www.programcreek.com/java-api-examples/index.php?class=org.apache.commons.beanutils.BeanUtils&method=cloneBean)