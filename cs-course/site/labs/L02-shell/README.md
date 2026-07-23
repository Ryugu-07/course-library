# L02 手写 Shell

这个最小 shell 支持外部命令、单管道、`<`/`>` 重定向、后台任务 `&`，以及 `cd`、
`jobs`、`exit` 三个内建命令。

```bash
make test
make run
```

交互示例：

```text
echo hello | tr a-z A-Z
printf file-data > /tmp/l02.txt
cat < /tmp/l02.txt
sleep 1 &
jobs
```

词法器允许操作符两侧没有空格，但刻意不实现引号展开、通配符和多级 job control。
扩展任务：加入多段管道和 `fg`，并说明为什么完整 shell 需要进程组与控制终端。

