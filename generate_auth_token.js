#!/usr/bin/env node
const readline = require('readline');
const Writable = require('stream').Writable;
const crypto = require('crypto');

const adminUserName = 'admin';
const salt = 'HXVS64VFFJ';

function authToken(user, password, salt) {
    const hash = crypto.createHash('sha256');
    return Buffer.from(user + ':' + hash.update(salt + ':' + password).digest('hex')).toString('base64')
}

const mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
        if (!this.muted)
            process.stdout.write(chunk, encoding);
        callback();
    }
});

mutableStdout.muted = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
});

rl.question('New master password: ', function(password) {
    console.log('\nYour auth token is: ' + authToken(adminUserName, password, salt));
    console.log('Write it to start.sh file as MASTER_PASSWORD env variable.');
    rl.close();
});

mutableStdout.muted = true;