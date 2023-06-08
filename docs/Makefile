.ONESHELL:
.DELETE_ON_ERROR:
export SHELL     := bash
export SHELLOPTS := pipefail:errexit
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rule

include docs.mk

GIT_ROOT := $(shell git rev-parse --show-toplevel)

.PHONY: copy-docusaurus
copy-docusaurus: ## Copy files from docusaurus docs until the site is no longer in use.
	rsync -av $(GIT_ROOT)/docusaurus/docs/ $(GIT_ROOT)/docs/sources

docs: copy-docusaurus
