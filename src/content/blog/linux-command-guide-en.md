---
title: 'Linux Command Line Practical Guide: Essential Developer Skills'
description: 'Master common Linux commands, file operations, process management, network tools and Shell scripting basics'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'en'
translationKey: 'linux-command-guide'
---

The command line is a fundamental developer tool. This article covers the most commonly used Linux commands and techniques.

## Files and Directories

### Navigation Commands

```bash
# Current directory
pwd

# List files
ls              # Basic list
ls -l           # Detailed info
ls -la          # Include hidden files
ls -lh          # Human-readable sizes
ls -lt          # Sort by time

# Change directory
cd /path/to/dir
cd ~            # Home directory
cd -            # Previous directory
cd ..           # Parent directory

# Find files
find . -name "*.js"                    # By name
find . -type f -size +1M               # Files larger than 1MB
find . -mtime -7                       # Modified in last 7 days
find . -name "*.log" -delete           # Find and delete
```

### File Operations

```bash
# Create
touch file.txt                         # Create empty file
mkdir dir                              # Create directory
mkdir -p path/to/nested/dir            # Create nested directories

# Copy
cp file.txt backup.txt                 # Copy file
cp -r dir1 dir2                        # Copy directory
cp -i file.txt dest/                   # Interactive (confirm overwrite)

# Move/Rename
mv old.txt new.txt                     # Rename
mv file.txt /path/to/dest/             # Move

# Delete
rm file.txt                            # Delete file
rm -r dir                              # Delete directory
rm -rf dir                             # Force delete (careful!)

# Links
ln -s /path/to/target linkname         # Symbolic link
```

### Viewing Files

```bash
# View content
cat file.txt                           # Show all
head -20 file.txt                      # First 20 lines
tail -20 file.txt                      # Last 20 lines
tail -f log.txt                        # Follow in real-time
less file.txt                          # Paginated view

# File info
file document.pdf                      # File type
stat file.txt                          # Detailed info
wc -l file.txt                         # Line count
du -sh dir                             # Directory size
df -h                                  # Disk usage
```

## Text Processing

### Search and Filter

```bash
# grep search
grep "pattern" file.txt                # Basic search
grep -i "pattern" file.txt             # Case insensitive
grep -r "pattern" dir/                 # Recursive search
grep -n "pattern" file.txt             # Show line numbers
grep -v "pattern" file.txt             # Inverse match
grep -E "regex" file.txt               # Extended regex

# Practical examples
grep -r "TODO" --include="*.js" .      # Search TODO in JS files
ps aux | grep node                     # Find node processes
```

### Text Transformation

```bash
# sed stream editor
sed 's/old/new/' file.txt              # Replace (first)
sed 's/old/new/g' file.txt             # Replace (all)
sed -i 's/old/new/g' file.txt          # Modify file directly
sed '10d' file.txt                     # Delete line 10
sed -n '5,10p' file.txt                # Show lines 5-10

# awk text processing
awk '{print $1}' file.txt              # Print first column
awk -F',' '{print $2}' file.csv        # CSV second column
awk '/pattern/' file.txt               # Matching lines
awk '{sum+=$1} END {print sum}' nums   # Sum values
```

### Sort and Deduplicate

```bash
# Sort
sort file.txt                          # Alphabetical sort
sort -n file.txt                       # Numeric sort
sort -r file.txt                       # Reverse
sort -k2 file.txt                      # Sort by second column

# Deduplicate
uniq file.txt                          # Remove adjacent duplicates
sort file.txt | uniq                   # Complete dedup
sort file.txt | uniq -c                # Count occurrences
```

## Process Management

### Viewing Processes

```bash
# Process list
ps aux                                 # All processes
ps aux | grep node                     # Filter
top                                    # Real-time monitor
htop                                   # Better monitor

# Process tree
pstree

# Port usage
lsof -i :3000                          # Check port usage
netstat -tlnp                          # Listening ports
ss -tlnp                               # Faster alternative
```

### Process Control

```bash
# Background execution
command &                              # Run in background
nohup command &                        # Continue after disconnect
nohup command > output.log 2>&1 &      # With logging

# Job control
jobs                                   # View background jobs
fg %1                                  # Bring to foreground
bg %1                                  # Send to background
Ctrl+Z                                 # Pause current process

# Terminate processes
kill PID                               # Normal terminate
kill -9 PID                            # Force terminate
killall processname                    # By name
pkill -f "pattern"                     # By pattern
```

## Permission Management

### File Permissions

```
Permission notation:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   rwxrwxrwx = 777                                   │
│   │││││││││                                         │
│   ││││││└└└── other users                           │
│   │││└└└──── group                                  │
│   └└└─────── owner                                  │
│                                                     │
│   r = 4 (read)                                      │
│   w = 2 (write)                                     │
│   x = 1 (execute)                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```bash
# Change permissions
chmod 755 script.sh                    # Numeric mode
chmod u+x script.sh                    # Symbolic mode
chmod -R 644 dir/                      # Recursive

# Change ownership
chown user file.txt                    # Change owner
chown user:group file.txt              # Change owner and group
chown -R user:group dir/               # Recursive
```

## Network Tools

### Network Requests

```bash
# curl - HTTP client
curl https://api.example.com           # GET request
curl -X POST -d "data" url             # POST request
curl -H "Authorization: Bearer token" url  # With headers
curl -o file.zip url                   # Download file
curl -I url                            # Headers only

# wget - Download tool
wget url                               # Download file
wget -c url                            # Resume download
wget -r url                            # Recursive download
```

### Network Diagnostics

```bash
# Connection test
ping google.com                        # Connectivity test
ping -c 4 google.com                   # Send only 4 packets

# DNS lookup
nslookup domain.com
dig domain.com

# Trace route
traceroute google.com

# Network interfaces
ip addr                                # View IP
ifconfig                               # Traditional way
```

## Shell Scripting Basics

### Variables and Arguments

```bash
#!/bin/bash

# Variables
name="World"
echo "Hello, $name"

# Command substitution
current_date=$(date +%Y-%m-%d)
file_count=$(ls | wc -l)

# Script arguments
echo "Script name: $0"
echo "First argument: $1"
echo "All arguments: $@"
echo "Argument count: $#"
```

### Conditionals

```bash
#!/bin/bash

# if statement
if [ -f "file.txt" ]; then
  echo "File exists"
elif [ -d "dir" ]; then
  echo "Directory exists"
else
  echo "Neither exists"
fi

# Common conditions
# -f file exists
# -d directory exists
# -z string is empty
# -n string is not empty
# -eq numbers equal
# -ne numbers not equal
# -gt greater than
# -lt less than
```

### Loops

```bash
#!/bin/bash

# for loop
for file in *.txt; do
  echo "Processing: $file"
done

for i in {1..10}; do
  echo $i
done

# while loop
count=0
while [ $count -lt 5 ]; do
  echo $count
  ((count++))
done

# Read file
while read line; do
  echo "$line"
done < file.txt
```

## Practical Tips

### Pipes and Redirection

```bash
# Pipes
ls | grep ".txt" | wc -l

# Redirection
command > file.txt                     # Overwrite
command >> file.txt                    # Append
command 2> error.log                   # Error output
command > out.log 2>&1                 # Merge output

# xargs
find . -name "*.log" | xargs rm
cat urls.txt | xargs -I {} curl {}
```

### Keyboard Shortcuts

```
Common Shortcuts:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Ctrl+C    Terminate current command               │
│   Ctrl+Z    Pause current command                   │
│   Ctrl+D    Exit current shell                      │
│   Ctrl+L    Clear screen                            │
│   Ctrl+R    Search command history                  │
│   Ctrl+A    Move to line start                      │
│   Ctrl+E    Move to line end                        │
│   Tab       Auto-complete                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Best Practices Summary

| Category | Common Commands |
|----------|-----------------|
| File Operations | ls, cd, cp, mv, rm, find |
| Text Processing | grep, sed, awk, sort, uniq |
| Process Management | ps, top, kill, nohup |
| Network Tools | curl, wget, ping, netstat |

---

*Master the command line to double your development efficiency.*
