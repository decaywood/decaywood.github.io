## Tornado 的服务器实现

Tornado 的 HTTPServer 是一种单线程的非阻塞服务器实现，继承自 TCPServer 基于 Tornado 的事件循环实现 IOLoop，HTTPServer和TCPServer的类结构：

```python
class TCPServer(object):
    def __init__(self, io_loop=None, ssl_options=None): 
    def listen(self, port, address=""): 
    def add_sockets(self, sockets): 
    def bind(self, port, address=None, family=socket.AF_UNSPEC, backlog=128): 
    def start(self, num_processes=1): 
    def stop(self): 
    def handle_stream(self, stream, address): 
    def _handle_connection(self, connection, address):
```

搭建 Tornado 服务器的方式很简单，首先配置请求与 handler 的路由，然后绑定监听端口，最后启动事件循环循环。HTTPServer 提供多种绑定端口方式，包括：listen、add\_sockets、add\_socket、bind。这里分析HTTPServer通过listen函数启动监听，这种方法是单进程模式。另外可以通过先后调用 bind 和 start 函数启动监听同时创建多进程服务器实例。第二步 HTTPServer 会通过基类 TCPServer 的 add\_accept\_handler 在 IOLoop 中注册异步回调，callback 与 socket 的 fd 绑定，IO 就绪后会触发对应的 callback。第三步调用 IOLoop::start 启动事件循环将监听对应端口。稍后会详细介绍这两步，一般的启动步骤如下：

```python
step1: http_server = tornado.httpserver.HTTPServer(Application())
step2: http_server.listen(8080)
step3: tornado.ioloop.IOLoop.instance().start()
```

Application 负责对请求路径与相应的 handler 进行映射，初始化 HTTPServer 作为参数传入并将其维护在 HTTPServer 的 request\_callback 成员变量中。继续看 listen 函数，listen 函数在 HTTPServer 基类 TCPServer 中实现：

```python
	def listen(self, port, address=""):
        sockets = bind_sockets(port, address=address)
        self.add_sockets(sockets)
```

listen 函数主要做了两件事：1、获取 IP、端口 对应的套接字。2、将套接字绑定在底层的 IO 事件回调中。第二点尤其关键，其具体实现在 add\_accept\_handler 函数中（省略部分代码）：

```python
def add_accept_handler(sock, callback, io_loop=None):
    if io_loop is None:
        io_loop = IOLoop.current()

    def accept_handler(fd, events):
        for i in xrange(_DEFAULT_BACKLOG):
            connection, address = sock.accept()
            callback(connection, address)
    io_loop.add_handler(sock, accept_handler, IOLoop.READ)
```

accept\_handler 为 IOLoop 监听到 IO 就绪事件后的回调函数，当 socket 对应的文件描述符读事件就绪时，便触发 accept\_handler，可以看到，函数内部是一个 for 循环，而不是 while 循环，这是因为当前端口可能同时有大量连接需要处理造成阻塞，导致其他端口出现饥饿状态，故设置了一个阈值，超过阈值就必须跳出循环，让其他套接字处理连接请求。此外，可以看见，连接拿到后，调用了 callback 函数。callback 函数具体实现为 \_handle\_connection 简化的代码如下：

```python
	def _handle_connection(self, connection, address):
	    try:
	        if self.ssl_options is not None:
	            stream = SSLIOStream(connection, io_loop=self.io_loop,
	                                     max_buffer_size=self.max_buffer_size,
	                                     read_chunk_size=self.read_chunk_size)
	        else:
	            stream = IOStream(connection, io_loop=self.io_loop,
	                              max_buffer_size=self.max_buffer_size,
	                              read_chunk_size=self.read_chunk_size)
	            future = self.handle_stream(stream, address)
	        if future is not None:
	            self.io_loop.add_future(future, lambda f: f.result())
	    except Exception:
	        app_log.error("Error in connection callback", exc_info=True)
```

如果配置了 ssl 协议，Tornado 会开启对应的 SSLIOStream，否则使用普通的 IOStream。之后会调用 handle\_stream 处理返回的数据。handle\_stream 在 TCPServer 中并没有实现，而是留给 派生类 HTTPServer 进行实现，具体实现如下：

```python
    def handle_stream(self, stream, address):
        context = _HTTPRequestContext(stream, address,
                                      self.protocol)
        conn = HTTP1ServerConnection(
            stream, self.conn_params, context)
        self._connections.add(conn)
        conn.start_serving(self)
```

首先，HTTPServer 会根据 stream 初始化请求上下文以及 TCP 连接相关信息并初始化,之后开始请求处理。

```python
   @gen.coroutine
    def _server_request_loop(self, delegate):
        try:
            while True:
                conn = HTTP1Connection(self.stream, False,
                                       self.params, self.context)
                request_delegate = delegate.start_request(self, conn)
                ret = yield conn.read_response(request_delegate)
                if not ret:
                    return
                yield gen.moment
        finally:
            delegate.on_close(self)
```

入参 delegate 为 HTTPServer，delegate.start\_request 返回了一个 \_ServerRequestAdapter （由 HTTPServer 初始化），\_ServerRequestAdapter 维护了一个 \_RequestDispatcher（由 Application 初始化），实际上，这两个类都继承自 httputil.HTTPMessageDelegate，\_RequestDispatcher 用来处理 HTTP 请求与响应，Adapter 则作为适配，在没有 Dispatcher 的情况下进行退化处理。除了这两个类外 \_GzipMessageDelegate 与其有相同的基类，常作为包装类，用于处理 gzip 压缩过的请求与响应。至此 HTTPServer 的创建、启动、注册回调函数的过程分析结束。


