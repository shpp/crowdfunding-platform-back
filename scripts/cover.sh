#!/usr/bin/env bash

# Set required environment variables
export NODE_ENV="test"
# MongoDB database URI
export MONGODB_URI="mongodb://localhost:27017/crowdfunding-test"

istanbul cover -x "lib/**/*.js" _mocha -- --recursive