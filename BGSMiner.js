const config = require('./config');
const BitlleJs = require('bitllejs');
var request = require('request');
var bitllejs = new BitlleJs();
bitllejs.web3.setProvider(new bitllejs.web3.providers.HttpProvider(config.RPC, 10000));
bitllejs.txSender.setConsoleLog(true);


var GS1 = bitllejs.iGasStation.GS1;
var decimals = 18;
var cashOutVal = config.cashOutVal * 10 ** decimals;
var lastEpoch = 0;
var tankToMine;
var txSent;
var auth;

if (bitllejs.config.GasStation.GS1.version != '0.3.2') throw new Error('iGasStation ERROR: unknown GS1 contract version');
if (config.address.length != 42) throw new Error('config ERROR: address is incorrect');
if (config.privateKey.length != 66) {
    if (config.privateKey.length == 64 && config.privateKey[0] != '0' && config.privateKey[1] != 'x') config.privateKey = '0x' + config.privateKey;
    else throw new Error('config ERROR: privete key is incorrect');
}

console.log('GasStation1 address:', GS1.address);
console.log('Miner address:', config.address);

function GetGasTank() {
    setTimeout(() => {

        request('http://195.201.124.142:3777/?address=' + config.address + '&slotsToMine=' + config.valueToMine, function (error, response, body) {
            if (error) console.log('request error:', error);
            else {
                auth = JSON.parse(body).auth;
                var myTanks = GS1.tanksOfOwner(config.address);
                console.log('Miner tanks', myTanks.toString());
                if (config.tankToMine == null && !myTanks.length) {
                    if (txSent) {
                        console.log('Mine() wating register gasTank tx...');
                        GetGasTank();
                    } else {
                        GS1.registerGasTank(config.privateKey);
                        txSent = true;
                        GetGasTank();
                    }
                } else {
                    tankToMine = (config.tankToMine == null) ? myTanks[0].toNumber() : config.tankToMine;
                    console.log('will mine to tankID: ' + tankToMine);
                    Mine();
                }
            }
        });

    }, 15000);
}

var locker;
function Mine() {
    if (!locker) locker = true;
    else return;
    setTimeout(() => {
        GS1.currentEpoch((e, r) => {
            if (e) {
                console.log('Mine() get epoch ERROR:', e);
                locker = false;
                Mine();
            } else {
                if (lastEpoch < r) {
                    request('http://195.201.124.142:3777/?address=' + config.address + '&slotsToMine=' + config.valueToMine + '&auth=' + auth, function (error, response, body) {
                        if (error) console.log('request error:', error);
                        else {
                            console.log(body);
                            if (body == 'ok') {
                                console.log('new epoch:', r.toNumber());
                                lastEpoch = r;
                                GetBounty(tankToMine, (e, r) => {
                                    console.log('mine', config.valueToMine, 'slots to tank ID:', tankToMine)
                                    GS1.mine(tankToMine, config.valueToMine, config.privateKey);
                                });
                            } else {
                                try {
                                    body = JSON.parse(body);
                                    if (body.auth) auth = body.auth;
                                } catch (error) {
                                    console.log('response parsing error', error);
                                }

                            }
                        }
                    });

                }
                locker = false;
                Mine();
            }
        })
    }, 15000);
}

function GetBounty(_tankID, callBack) {
    GS1.calcBounty(_tankID, (e, r) => {
        if (e) {
            console.log('GetBounty error');
            callBack(e);
        } else {
            console.log('current bounty amount', r.bounty.toNumber() / (10 ** decimals), 'BTL');
            if (r.bounty >= cashOutVal) {
                console.log('Bounty receiving of', r.bounty.toNumber() / (10 ** decimals), 'BTL');
                GS1.getBounty(_tankID, config.privateKey, callBack);
            } else {
                callBack();
            }
        }
    });
}


module.exports = {
    GetGasTank: GetGasTank,
    Mine: Mine,
    GetBounty: GetBounty
}