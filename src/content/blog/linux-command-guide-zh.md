---
title: 'Linux 命令行实用指南：开发者必备技能'
description: '掌握常用 Linux 命令、文件操作、进程管理、网络工具和 Shell 脚本基础'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'linux-command-guide'
---

命令行是开发者的基本工具。本文介绍开发中最常用的 Linux 命令和技巧。

## 文件与目录

### 导航命令

```bash
# 当前目录
pwd

# 列出文件
ls              # 基本列表
ls -l           # 详细信息
ls -la          # 包含隐藏文件
ls -lh          # 人类可读的大小
ls -lt          # 按时间排序

# 切换目录
cd /path/to/dir
cd ~            # 家目录
cd -            # 上一个目录
cd ..           # 上级目录

# 查找文件
find . -name "*.js"                    # 按名称
find . -type f -size +1M               # 大于1MB的文件
find . -mtime -7                       # 7天内修改的
find . -name "*.log" -delete           # 查找并删除
```

### 文件操作

```bash
# 创建
touch file.txt                         # 创建空文件
mkdir dir                              # 创建目录
mkdir -p path/to/nested/dir            # 创建嵌套目录

# 复制
cp file.txt backup.txt                 # 复制文件
cp -r dir1 dir2                        # 复制目录
cp -i file.txt dest/                   # 交互式（确认覆盖）

# 移动/重命名
mv old.txt new.txt                     # 重命名
mv file.txt /path/to/dest/             # 移动

# 删除
rm file.txt                            # 删除文件
rm -r dir                              # 删除目录
rm -rf dir                             # 强制删除（谨慎！）

# 链接
ln -s /path/to/target linkname         # 符号链接
```

### 文件查看

```bash
# 查看内容
cat file.txt                           # 显示全部
head -20 file.txt                      # 前20行
tail -20 file.txt                      # 后20行
tail -f log.txt                        # 实时跟踪
less file.txt                          # 分页查看

# 文件信息
file document.pdf                      # 文件类型
stat file.txt                          # 详细信息
wc -l file.txt                         # 行数
du -sh dir                             # 目录大小
df -h                                  # 磁盘使用
```

## 文本处理

### 搜索与过滤

```bash
# grep 搜索
grep "pattern" file.txt                # 基本搜索
grep -i "pattern" file.txt             # 忽略大小写
grep -r "pattern" dir/                 # 递归搜索
grep -n "pattern" file.txt             # 显示行号
grep -v "pattern" file.txt             # 反向匹配
grep -E "regex" file.txt               # 扩展正则

# 实用示例
grep -r "TODO" --include="*.js" .      # 搜索JS文件中的TODO
ps aux | grep node                     # 查找node进程
```

### 文本转换

```bash
# sed 流编辑器
sed 's/old/new/' file.txt              # 替换（首个）
sed 's/old/new/g' file.txt             # 替换（全部）
sed -i 's/old/new/g' file.txt          # 直接修改文件
sed '10d' file.txt                     # 删除第10行
sed -n '5,10p' file.txt                # 显示5-10行

# awk 文本处理
awk '{print $1}' file.txt              # 打印第一列
awk -F',' '{print $2}' file.csv        # CSV第二列
awk '/pattern/' file.txt               # 匹配行
awk '{sum+=$1} END {print sum}' nums   # 求和
```

### 排序与去重

```bash
# 排序
sort file.txt                          # 字母排序
sort -n file.txt                       # 数字排序
sort -r file.txt                       # 逆序
sort -k2 file.txt                      # 按第二列排序

# 去重
uniq file.txt                          # 去除相邻重复
sort file.txt | uniq                   # 完全去重
sort file.txt | uniq -c                # 计数
```

## 进程管理

### 查看进程

```bash
# 进程列表
ps aux                                 # 所有进程
ps aux | grep node                     # 过滤
top                                    # 实时监控
htop                                   # 更好的监控

# 进程树
pstree

# 端口占用
lsof -i :3000                          # 查看端口占用
netstat -tlnp                          # 监听端口
ss -tlnp                               # 更快的替代
```

### 进程控制

```bash
# 后台运行
command &                              # 后台运行
nohup command &                        # 断开终端后继续运行
nohup command > output.log 2>&1 &      # 带日志

# 作业控制
jobs                                   # 查看后台作业
fg %1                                  # 调到前台
bg %1                                  # 调到后台
Ctrl+Z                                 # 暂停当前进程

# 终止进程
kill PID                               # 正常终止
kill -9 PID                            # 强制终止
killall processname                    # 按名称终止
pkill -f "pattern"                     # 按模式终止
```

## 权限管理

### 文件权限

```
权限表示：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   rwxrwxrwx = 777                                   │
│   │││││││││                                         │
│   ││││││└└└── 其他用户 (other)                      │
│   │││└└└──── 所属组 (group)                         │
│   └└└─────── 所有者 (owner)                         │
│                                                     │
│   r = 4 (读)                                        │
│   w = 2 (写)                                        │
│   x = 1 (执行)                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```bash
# 修改权限
chmod 755 script.sh                    # 数字方式
chmod u+x script.sh                    # 符号方式
chmod -R 644 dir/                      # 递归修改

# 修改所有者
chown user file.txt                    # 改变所有者
chown user:group file.txt              # 改变所有者和组
chown -R user:group dir/               # 递归修改
```

## 网络工具

### 网络请求

```bash
# curl - HTTP 客户端
curl https://api.example.com           # GET请求
curl -X POST -d "data" url             # POST请求
curl -H "Authorization: Bearer token" url  # 带头信息
curl -o file.zip url                   # 下载文件
curl -I url                            # 只获取头信息

# wget - 下载工具
wget url                               # 下载文件
wget -c url                            # 断点续传
wget -r url                            # 递归下载
```

### 网络诊断

```bash
# 连接测试
ping google.com                        # 连通性测试
ping -c 4 google.com                   # 只发4个包

# DNS 查询
nslookup domain.com
dig domain.com

# 路由追踪
traceroute google.com

# 网络接口
ip addr                                # 查看IP
ifconfig                               # 传统方式
```

## Shell 脚本基础

### 变量与参数

```bash
#!/bin/bash

# 变量
name="World"
echo "Hello, $name"

# 命令替换
current_date=$(date +%Y-%m-%d)
file_count=$(ls | wc -l)

# 脚本参数
echo "脚本名: $0"
echo "第一个参数: $1"
echo "所有参数: $@"
echo "参数个数: $#"
```

### 条件判断

```bash
#!/bin/bash

# if 语句
if [ -f "file.txt" ]; then
  echo "文件存在"
elif [ -d "dir" ]; then
  echo "目录存在"
else
  echo "都不存在"
fi

# 常用条件
# -f 文件存在
# -d 目录存在
# -z 字符串为空
# -n 字符串非空
# -eq 数字相等
# -ne 数字不等
# -gt 大于
# -lt 小于
```

### 循环

```bash
#!/bin/bash

# for 循环
for file in *.txt; do
  echo "处理: $file"
done

for i in {1..10}; do
  echo $i
done

# while 循环
count=0
while [ $count -lt 5 ]; do
  echo $count
  ((count++))
done

# 读取文件
while read line; do
  echo "$line"
done < file.txt
```

## 实用技巧

### 管道与重定向

```bash
# 管道
ls | grep ".txt" | wc -l

# 重定向
command > file.txt                     # 覆盖
command >> file.txt                    # 追加
command 2> error.log                   # 错误输出
command > out.log 2>&1                 # 合并输出

# xargs
find . -name "*.log" | xargs rm
cat urls.txt | xargs -I {} curl {}
```

### 快捷键

```
常用快捷键：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Ctrl+C    终止当前命令                            │
│   Ctrl+Z    暂停当前命令                            │
│   Ctrl+D    退出当前shell                           │
│   Ctrl+L    清屏                                    │
│   Ctrl+R    搜索历史命令                            │
│   Ctrl+A    移到行首                                │
│   Ctrl+E    移到行尾                                │
│   Tab       自动补全                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 最佳实践总结

| 类别 | 常用命令 |
|------|----------|
| 文件操作 | ls, cd, cp, mv, rm, find |
| 文本处理 | grep, sed, awk, sort, uniq |
| 进程管理 | ps, top, kill, nohup |
| 网络工具 | curl, wget, ping, netstat |

---

*熟练使用命令行，让开发效率翻倍。*
