#!/bin/bash

grunt docco
mkdir -p tmp
cp -r docs/ tmp/

git checkout gh-pages

git checkout master -- src/pso.js
cp -r tmp/docs/ docs/
