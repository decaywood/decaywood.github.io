---
layout:     post
random-img: true
title:      Git 备忘录
subtitle:   More about Java volatile
date:       2016-02-01 17:36:29
author:     decaywood
description: Git 的一些常用操作备忘。
keywords: Git
tags:
    - 总结
---

## 基本设置

配置资料:

```bash
# 配置用户名
git config --global user.name "Your Real Name"
# 配置邮箱地址
git config --global user.email you@email.address
```

生成 SSH 密钥:

```bash
ssh-keygen -C 'your@email.address' -t rsa
```

初始化一个项目:

```bash
# 初始化 git 项目
git init
# 添加一个叫 origin 的源
# 使用 ssh 地址
git remote add origin git@github.com:username/reponame.git
# 使用 username/password 登录 https 地址
git remote add origin https://username@password:github.com/username/reponame.git
```

推送到服务器:

```bash
# 记录所有新增和删除的文件
git add -A
# 更新理由
git commit -m "message"
# 推送到服务器端
git push origin master
```

更新到本地:

```bash
# 源 + 分支名
git pull origin master
```

克隆项目:

```bash
下载代码时有用:

# 克隆到以这个项目名命名的文件夹
git clone https://github.com/username/reponame.git
# 克隆到你自定义的文件夹
git clone https://github.com/username/reponame.git name
```

## 高级操作

版本控制系统的一个好处就是你可以轻易地撤销之前错误的操作。

当你用 git commit 提交了一个新的更改后 git 会将当时的文件内容暂时保存下来，之后你就可以用 git 随意回滚到任意一个版本。

### 撤销一个已发布的更新

情景: 你已经用 git push 将代码提交到了 GitHub，然后你意识到这其中的一个 commit 有错误，于是你想撤销那个 commit:

```bash
git revert <SHA>
```

效果: git 会新建一个新的 commit 来执行提供的 对应 commit 的相反的更改，任何在该旧 commit 中删除的内容将会在新 commit 中添加进去，反之亦然。

这是 git 里最安全的撤消操作的办法，因为这不会影响你的提交历史。于是现在你可以提交新的 commit 去撤销之前错误的操作了。

### 修改上次 commit 的提交信息

情景: 你在上次 commit 提交信息中打错了一个单词，比如你执行了 git commit -m "fxied bug #42" 然后你意识到应该是 fixed bug #42:

```bash
git commit --amend 或 git commit --amend -m "Fixes bug #42"
```

效果: git commit --amend 结合最新的文件修改情况和上一次提交信息更新并替换上一次提交。没有新的文件更改就直接覆盖上次提交。

### 撤销本地修改

情景: 你家的喵星人跑到你的键盘上装逼用双爪打字然后不知怎么还点了保存，然后编辑器还崩溃了，你还没有 commit 这只猫做的修改，你想撤销那个文件里被猫修改的内容。

```bash
git checkout -- <bad filename>
```

效果: git checkout 会将该文件的内容恢复到上一次 git commit 的状态。你可以提供一个分支名称或者直接提供要回到的 SHA。

请记住，这种方法作出的撤销是彻底的，这些内容不会被 commit 所以之后你并不能再用 git 恢复这些内容。

### 重置本地修改

情景: 你在本地 commit 了一些内容（并没有 push），但是你搞错了，你想撤销最近这三个 commit，就像让它们从来不存在那样。

```bash
git reset <last good SHA> 或 git reset --hard <last good SHA>
```

效果: git reset 会让你的 git 历史会退到你指定的 SHA 的状态。这些 commit 不存在了但是你硬盘上的这些文件还是维持在被修改了的状态，这是最安全的做法。但是有时你也想同时撤销硬盘上的修改，这时加上 --hard 就会很有用。

### 撤销本地修改之后重做

情景: 你提交了一些 commit，然后执行 git reset --hard 来撤消这些 commit 并清除本地硬盘上的修改。但是最后你意识到你想要回这些 commit！

```bash
git reflog && git reset (或 git checkout)
```

效果: git reflog 是个修复项目提交历史的好方法。你可以找回几乎所有内容 —— 所有你 commit 过的内容 —— 用 reflog 就行。

你可能对 git log 很熟悉，这个操作会列出你的 git 提交历史。git reflog 很像它，但是列出的是 HEAD 修改的时间。

一些说明:

HEAD 修改。在切换分支时 HEAD 会被修改，用 commit 保存修改然后用 reset 撤消修改。但是在你 ```git checkout -- <bad filename>``` 时并不会被修改，就像上面说过的那样，这些修改不会被 commit，所以 git reflog 也不能帮你找回这些内容。

git reflog 不是永远有用的。git 会定期清理那些无法追溯的内容。不要期望能用 git reflog 找回一个多月以前的内容。

你的 git reflog 仅对你有用。你不能用 git reflog 来找回其他人 commit 的修改。
reflog

然后…接下来怎么做才能撤销之前的撤销？这取决你到你要干什么:

如果你想回到一个特定的时间，用 ```git reset --hard <SHA>```。

如果你想在不修改提交历史的情况下找回那些文件并作为新文件保存，用 ```git checkout <SHA> -- <filename>```。

如果你想使其中一个 commit 回到你的项目历史中，用 ```git cherry-pick <SHA>```。

### 提交到了另一个分支

情景: 你提交了一些 commits，然后意识到你当前是在 master 分支上，而你其实是想提交到一个 feature 分支上:

```bash
git branch feature, git reset --hard origin/master, 和 git checkout feature
```

效果: 你可能常常使用 ```git checkout -b <name>``` 操作来检出一个新分支，这是一个很方便的创建新分支的操作，但是你并不想同时切换到那个分支上。现在使用 git branch feature 既可以创建一个 feature 新分支并且不会切换到那个分支，同时该分支会指向你当前分支最新的一个 commit。

下一步，用 ```git reset --hard``` 去恢复 master 分支到 origin/master 的状态。

最后，```git checkout``` 到你的 feature 分支，你能看到所有的更改。

覆盖整个分支

情景: 你基于 master 分支创建了 feature 分支，但是 master 分支远远落后 origin/master 的更改。现在 master 分支和 origin/master 同步了，你想马上同步到 feature 分支，还不是再次远远落后:

```bash
git checkout feature && git rebase master
```

效果: 你可能知道用 git reset 然后重新 commit 来达到类似效果，不过那样会丢失 commit 历史。

## 新增更新 :

### Git commit message写错了,有办法进行修改吗?

```bash
# 可以对上一次的提交做修改
git commit --amend
```

Keep Updating…
