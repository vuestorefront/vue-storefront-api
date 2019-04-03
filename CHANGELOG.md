# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0-rc.2] - unreleased
- Update Babel from 6 to 7 - @lukeromanowicz
- Support unicode characters in order requests - @lukeromanowicz (#201)
- TravisCI configured for building and linting - @lukeromanowicz (#204)

## [1.9.0-rc.1] - 2019.03.04
- Changed location of magento1 platform js client. Moved from `src/platform/magento1/module` to [magento1-vsbridge-client](https://github.com/DivanteLtd/magento1-vsbridge-client) - @mtarld (#195)

## [1.8.3] - 2019.03.05
- Use store id from configuration in `mage2vs import` - @boehsermoe (#179)

## [1.8.2] - 2019.03.04
- Magento 1 bridge client - @afirlejczyk (#190)
- configurable ElasticSearch `apiVersion` - @Resubaka (#192)

## [1.8.1] - 2019.02.11
- Fixed `apiVersion` property for ElasticSearch driver - now it's available thru `config/*.json` - @mdanilowicz (#185)
