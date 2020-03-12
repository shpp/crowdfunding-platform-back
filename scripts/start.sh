#!/usr/bin/env bash

# Set required environment variables
# Server URL is needed to provide it to LiqPay processing center for it
# to be able to call back crowd-funding API for transactions status confirmation
export SERVER_URL="https://donate.shpp.me"
export FRONTEND_URL="https://donate.shpp.me"
# Specify a port on which server will be listening
export PORT=80
# MongoDB database URI
export MONGODB_URI="mongodb://localhost:27017/shpp-crowd-funding"
# LiqPay API public and private keys
export LIQPAY_PUBLIC_KEY=""
export LIQPAY_PRIVATE_KEY=""
# Path to store binary assets that can't be fitted to DB
export FILE_STORAGE_PATH=""
# Admin password token (can be generated with generate_auth_token.js)
export ADMIN_TOKEN=""

# Run the application
node src/app.js
