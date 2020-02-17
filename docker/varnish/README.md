### Tutorial
1. Create network with `docker network create <your_network>`
2. Use `docker network ls` and find your network. It should have prefix!
E.g. when I used `docker network create some-net`, I have network with name `vuestorefrontapi_some-net`
3. Open docker-compose.yml:
At the end:
```yaml
networks:
  vuestorefrontapi_some-net:
    external: true
```
Set vuestorefrontapi_some-net to your network name

4. Check each `docker-compose` file and set proper network name.
5. In the docker-compose.nodejs.yml it should not have a prefix, e.g:
```yaml
    networks:
      - some-net

networks:
  some-net:
    driver: bridge
```
You can find Docker Compose files with applied network settings inside docker/varnish/docker-compose

### How does it work?
1. I add output tags to the VSF-API response:
```js
const tagsHeader = output.tags.join(' ')
res.setHeader('X-VS-Cache-Tag', tagsHeader)
```

2. After it invalidates cache in the Redis. I forward request to the:
```js
http://${config.varnish.host}:${config.varnish.port}/
```
With invalidate tag in headers:
```js
headers: {
  "X-VS-Cache-Tag": tag
}
```

I set Varnish invalidate method to `BAN` but you can change it in your config + varnish's config.

3. Configuration of BANning we have inside `docker/varnish/config.vcl` in `vcl_recv`. 
It tries to BAN resource which has `X-VS-Cache-Tag` header:
```vcl
# Logic for the ban, using the X-Cache-Tag header.
if (req.http.X-VS-Cache-Tag) {
  ban("obj.http.X-VS-Cache-Tag ~ " + req.http.X-VS-Cache-Tag);
}
```

Below under BANning logic. I have to tell Varnish what to cache.
```vcl
if (req.url ~ "^\/api\/catalog\/") {
  if (req.method == "POST") {
    # It will allow me to cache by req body in the vcl_hash
    std.cache_req_body(500KB);
    set req.http.X-Body-Len = bodyaccess.len_req_body();
  }
 
  if ((req.method == "POST" || req.method == "GET")) {
    return (hash);
  }
}
```

I am caching request that starts with `/api/catalog/`. As you can see I cache both POST and GET.
This is because in my project I use huge ES requests to compute Faceted Filters. I would exceed HTTP GET limit.

Thanks to this line and `bodyaccess`, I can distinguish requests to the same URL by their body!
```vcl
std.cache_req_body(500KB);
```

Then in `vcl_hash` I create hash for POST requests with `bodyaccess.hash_req_body()`:
```vcl
sub vcl_hash {
    # To cache POST and PUT requests
    if (req.http.X-Body-Len) {
        bodyaccess.hash_req_body();
    } else {
        hash_data("");
    }
}
```

By default, Varnish change each request to HTTP GET. We need to tell him to send POST requests to the VSF-API as POST - not GET.
We will do it like that:
```vcl
sub vcl_backend_fetch {
    if (bereq.http.X-Body-Len) {
        set bereq.method = "POST";
    }
}
```


### Caching Stock
It might be a good idea to cache stock requests if you check it often (filterUnavailableVariants, configurableChildrenStockPrefetchDynamic) in VSF-PWA in visiblityChanged hook (product listing).
In one project when I have slow Magento - it reduced Time-To-Response from ~2s to ~70ms.

```vcl
if (req.url ~ "^\/api\/stock\/") {
  if (req.method == "GET") {
    # M2 Stock
    return (hash);
  }
}
```

Then in `vcl_backend_response` you should set safe TTL (Time to live) for your stock cache. I've set 15 minutes (900 seconds)
```vcl
sub vcl_backend_response {
    # Set ban-lurker friendly custom headers.
    if (beresp.http.X-VS-Cache && beresp.http.X-VS-Cache ~ "Miss") {
      set beresp.ttl = 0s;
    }
    if (bereq.url ~ "^\/api\/stock\/") {
      set beresp.ttl = 900s; // 15 minutes
    }
    set beresp.http.X-Url = bereq.url;
    set beresp.http.X-Host = bereq.http.host;
}
```

For X-VS-Cache, I set TTL 0s so it is permanent. Because it will be automaticly invalidated when needed.

### Caching Extensions
You might want to cache response from various extensions.
E.g. I am fetching Menus, Available Countries (for checkout) from M2 by VSF-API proxy.
As in this project Magento is pretty slow. By caching responses I've changed response time from ~2s
to around ~50ms.

How to do that?
Inside `vcl_recv` add:
```vcl
# As in my case I want to cache only GET requests 
if (req.method == "GET") {
  # Countries for storecode GET - M2 - /directory/countries
  if (req.url ~ "^\/api\/ext\/directory\/") {
    return (hash);
  }
 
  # Menus GET - M2 - /menus & /nodes
  if (req.url ~ "^\/api\/ext\/menus\/") {
    return (hash);
  }
}
```

How to invalidate extension's tag?
You can do it by sending request with `X-VS-Cache-Ext` header.
If value of this header is part of any cached URL - it will be invalidated.
E.g. for menus extension:
```
/api/ext/menus
```
You could send:
BAN `http://${config.varnish.host}:${config.varnish.port}/`
headers: {
  "X-VS-Cache-Ext": "menus"
}

But sending HTTP requests is not so handy. So I've extended Invalidate endpoint. To the same you could just open:
```
http://localhost:8080/invalidate?key=aeSu7aip&ext=menus
```

As value of the `ext` will be searched inside `Cached URL`.
If you would provide here `product` it would cache product's catalog. You should have it in mind.

### Banning permissions
It will be allowed only from certain IPs. In my case I put here only VSF-API IP. But here we have `app` as Docker will resolve it as VSF-API IP:
```vcl
acl purge {
  "app";   // IP which can BAN cache - it should be VSF-API's IP
}
```

### What to cache
We should provide to Varnish - IP & Port to cache, there we have it:
```vcl
backend default {
  .host = "app";
  .port = "8080";
}
```

### URL
Varnish by default using port `80` but by Docker's port mapping we are using `1234`

### How to install on VPS
1. Install Varnish
2. Install Varnish Modules
3. By using Reverse Proxy output `/api` from Varnish, to the world

I'll try to prepare more detailed tutorial (with commands) as I will probably do it again in the following month.