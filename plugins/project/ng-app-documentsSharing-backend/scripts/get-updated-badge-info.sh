#!/bin/bash

echo "collecting stas for badges"

commits=`git rev-list --all --count`
echo "{\"commits\":\"$commits\"}" > badges.json
