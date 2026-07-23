# L12 从 Socket 到 HTTP/1.1

`server.py` 直接基于 `socketserver` 实现 HTTP/1.1 请求解析、keep-alive、静态文件与
chunked response，不依赖 Web 框架。

```bash
python3 -m unittest -v
python3 server.py --port 8088 --root public
```

访问 `/` 得到文本，`/stream` 得到三段 chunked 响应，`/static/hello.txt` 读取静态
文件。实现有 64 KiB 请求头上限和路径穿越保护。扩展任务：加入 `HEAD`、条件请求和
并发压测，并解释慢客户端为什么需要超时与背压。

