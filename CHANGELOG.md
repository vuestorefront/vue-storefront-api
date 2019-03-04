# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.1] - 2019.02.11
- Fixed `apiVersion` property for ElasticSearch driver - now it's available thru `config/*.json` - @mdanilowicz (#185)
- Changed location of magento1 platform js client. Moved from `src/platform/magento1/module` to [magento1-vsbridge-client](https://github.com/DivanteLtd/magento1-vsbridge-client) - @mtarld (#195)