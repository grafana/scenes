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
	git clean -fx -- .
	rsync -av $(GIT_ROOT)/docusaurus/docs/{getting-started,core-concepts}.md $(GIT_ROOT)/docs/sources/getting-started/
	rsync -av $(GIT_ROOT)/docusaurus/docs/{advanced-custom-scene-objects,advanced-activation-handlers,advanced-data,advanced-variables}.md $(GIT_ROOT)/docs/sources/advanced-usage/
	rsync -av $(GIT_ROOT)/docusaurus/docs/{visualizations,variables,transformations}.md $(GIT_ROOT)/docs/sources/scene-objects/
	rsync -av $(GIT_ROOT)/docusaurus/docs/{scene-app-tabs,scene-app-drilldown}.md $(GIT_ROOT)/docs/sources/scene-objects/scene-app/

docs: copy-docusaurus
