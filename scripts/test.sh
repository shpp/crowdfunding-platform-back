#!/usr/bin/env bash

# Set required environment variables
export NODE_ENV="test"
# MongoDB database URI
export MONGODB_URI="mongodb://localhost:27017/shpp-crowd-funding-test"

# Run the tests
mocha --recursive