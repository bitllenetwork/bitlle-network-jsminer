const config = require('./config');
const BitlleJs = require('bitllejs');
var bitllejs = new BitlleJs();
bitllejs.web3.setProvider(new bitllejs.web3.providers.HttpProvider(config.RPC, 10000));
bitllejs.txSender.setConsoleLog(true);


var GS1 = bitllejs.iGasStation.GS1;
var decimals = 18;
var cashOutVal = config.cashOutVal * 10 ** decimals;
var lastEpoch = 0;
var tankToMine;
var txSent;

if (bitllejs.config.GasStation.GS1.version != '0.3.0') throw new Error('iGasStation ERROR: unknown GS1 contract version');
if (config.address.length != 42) throw new Error('config ERROR: address is incorrect');
if (config.privateKey.length != 66) {
    if (config.privateKey.length == 64 && config.privateKey[0] != '0' && config.privateKey[1] != 'x') config.privateKey = '0x' + config.privateKey;
    else throw new Error('config ERROR: privete key is incorrect');
}

console.log('GasStation1 address:', GS1.address);
console.log('Miner address:', config.address);



function GetGasTank() {
    setTimeout(() => {

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

    }, 15000);
}

function Mine() {
    setTimeout(() => {
        GS1.currentEpoch((e, r) => {
            if (e) {
                console.log('Mine() get epoch ERROR:', e);
                Mine();
            } else {
                if (lastEpoch < r) {
                    console.log('new epoch:', r.toNumber());
                    lastEpoch = r;
                    GetBounty(tankToMine, (e, r) => {
                        console.log('mine', config.valueToMine, 'slots to tank ID:', tankToMine)
                        GS1.mine(tankToMine, config.valueToMine, config.privateKey);
                    });
                }
                //console.log('cur epoch', r.toNumber());
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