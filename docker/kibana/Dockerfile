FROM docker.elastic.co/kibana/kibana:5.6.11

RUN bin/kibana-plugin remove x-pack && \
    kibana 2>&1 | grep -m 1 "Optimization of .* complete"

# Add your kibana plugins setup here
# Example: RUN kibana-plugin install <name|url>
