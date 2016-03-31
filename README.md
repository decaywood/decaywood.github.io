# [decaywood.github.io](http://decaywood.github.io/)

## 为了方便写的自动化脚本：

* [jekyll_install.sh](https://github.com/decaywood/decaywood.github.io/blob/master/shell/jekyll_install.sh)一键安装环境

```bash
sh jekyll_install.sh
```

* [catalogGenerator.py](https://github.com/decaywood/decaywood.github.io/blob/master/shell/catalogGenerator.py)自动生成markdown目录脚本,目前已实现JavaScript自动生成目录，此脚本弃用

```bash
python catalogGenerator.py _posts/your_file.md
```
* [PicRename.java](https://github.com/decaywood/decaywood.github.io/blob/master/shell/PicRename.java) 重命名指定文件夹内的jpg文件(命名后：1.jpg 2.jpg ... n.jpg)，用于随机请求背景图片

```bash
javac PicRename.java
mv PicRename.class your_pic_dir
cd your_pic_dir
java PicRename
cd change
```