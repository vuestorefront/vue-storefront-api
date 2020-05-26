

vcl 4.0;
 
import std;
import bodyaccess;
 
acl purge {
  "app";   // IP which can BAN cache - it should be VSF-API's IP
}


backend default {
  .host = "app";
  .port = "8080";
}
 
sub vcl_recv {
  unset req.http.X-Body-Len;
  # Only allow BAN requests from IP addresses in the 'purge' ACL.
  if (req.method == "BAN") {
    # Same ACL check as above:
    if (!client.ip ~ purge) {
      return (synth(403, "Not allowed."));
    }
 
    # Logic for the ban, using the X-Cache-Tags header.
    if (req.http.X-VS-Cache-Tag) {
      ban("obj.http.X-VS-Cache-Tag ~ " + req.http.X-VS-Cache-Tag);
    }
    if (req.http.X-VS-Cache-Ext) {
      ban("req.url ~ " + req.http.X-VS-Cache-Ext);
    }
    if (!req.http.X-VS-Cache-Tag && !req.http.X-VS-Cache-Ext) {
      return (synth(403, "X-VS-Cache-Tag or X-VS-Cache-Ext header missing."));
    }
 
    # Throw a synthetic page so the request won't go to the backend.
    return (synth(200, "Ban added."));
  }
 
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
 
  if (req.url ~ "^\/api\/ext\/") {
    if (req.method == "GET") {
      # Custom packs GET - M2 - /jimmylion/pack/${req.params.packId}
      if (req.url ~ "^\/api\/ext\/custom-packs\/") {
        return (hash);
      }
 
      # Countries for storecode GET - M2 - /directory/countries
      if (req.url ~ "^\/api\/ext\/directory\/") {
        return (hash);
      }
 
      # Menus GET - M2 - /menus & /nodes
      if (req.url ~ "^\/api\/ext\/menus\/") {
        return (hash);
      }
    }
  }

  if (req.url ~ "^\/api\/stock\/") {
    if (req.method == "GET") {
      # M2 Stock
      return (hash);
    }
  }
 
  return (pipe);
 
}
 
sub vcl_hash {
    # To cache POST and PUT requests
    if (req.http.X-Body-Len) {
        bodyaccess.hash_req_body();
    } else {
        hash_data("");
    }
}
 
sub vcl_backend_fetch {
    if (bereq.http.X-Body-Len) {
        set bereq.method = "POST";
    }
}
 
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

sub vcl_deliver {
    if (obj.hits > 0) {
      set resp.http.X-Cache = "HIT_1";
      set resp.http.X-Cache-Hits = obj.hits;
    } else {
      set resp.http.X-Cache = "MISS_1";
    }
    set resp.http.X-Cache-Expires = resp.http.Expires;
    unset resp.http.X-Varnish;
    unset resp.http.Via;
    unset resp.http.Age;
    unset resp.http.X-Purge-URL;
    unset resp.http.X-Purge-Host;
    # Remove ban-lurker friendly custom headers when delivering to client.
    unset resp.http.X-Url;
    unset resp.http.X-Host;
    # Comment these for easier Drupal cache tag debugging in development.
    unset resp.http.X-Cache-Tags;
    unset resp.http.X-Cache-Contexts;
}