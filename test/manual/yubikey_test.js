/**
 * Manually running integration test of yubikey functionality used in the project.
 * It needs to have configured yubikey device.
 */
'use strict';

const stdin = process.stdin;
const stdout = process.stdout;
const clientId = '31496';
const secretId = '6xW5uYTqT/79QQpsTb/BxursL9c=';
const Yubikey = require('../../server/backend/yubikey');
const yubikey = new Yubikey(clientId, secretId);

function verify(otp) {
  yubikey.verify(otp, function(err) {
    if (err) {
      stdout.write(err + "\n");
    } else {
      stdout.write("Success! Your token was verified.\n");
    }
    process.exit(0);
  });
}

function readOTP() {
  stdin.resume();
  stdout.write("YubiKey OTP: ");
  stdin.once('data', function(buf) {
    const str = buf.toString().trim();
    verify(str);
  });
}

if (!module.parent) {
  readOTP();
}
