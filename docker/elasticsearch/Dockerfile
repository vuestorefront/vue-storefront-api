FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.9

RUN bin/elasticsearch-plugin remove x-pack --purge

# Add your elasticsearch plugins setup here
# Example: RUN elasticsearch-plugin install analysis-icu

USER root

COPY wrapper.sh /usr/local/bin/

CMD ["wrapper.sh"]
