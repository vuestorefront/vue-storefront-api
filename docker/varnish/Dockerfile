FROM cooptilleuls/varnish:6.0-stretch

# install varnish-modules
RUN apt-get update -y && \
	    apt-get install -y build-essential automake libtool curl git python-docutils && \
	    curl -s https://packagecloud.io/install/repositories/varnishcache/varnish60/script.deb.sh | bash;

RUN apt-get install -y pkg-config libvarnishapi1 libvarnishapi-dev autotools-dev;

RUN git clone https://github.com/varnish/varnish-modules.git /tmp/vm;
RUN cd /tmp/vm; \
			git checkout 6.0; \
	    ./bootstrap && \
	    ./configure;

RUN cd /tmp/vm && \
			make && \
	    make check && \
	    make install;