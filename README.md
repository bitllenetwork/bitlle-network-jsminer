# BitlleGasStation Miner

This script is a simple example built for the implementation of space reservation in [BitlleGasStation1 smart contract](https://ropsten.etherscan.io/address/0x06836be4e6273d77ee7429e0e6414398a81e3dd2#contracts) and [BTL](https://ropsten.etherscan.io/token/0x752777721dd5fe2db110e9e03b3b8feacff1665e) mining.

## Installation

Use the package manager [npm](https://www.npmjs.com/package/bgsminer) to install BitlleGasStation Miner.

```bash
npm install bgsminer
```

## Configuration

Replace the data in the [config.js](./config.js) with your own.  

```JavaScript
{
    address: '0x.......................................',
    privateKey:'0x.......................................................' ,
    valueToMine: 1,
    cashOutVal: 500,
    RPC : 'https://ropsten.infura.io/',
    tankToMine: null
}
```

## Usage

Can be used as node module

```JS
var bgsminer = require('bgsminer');
bgsminer.GetGasTank();
```

or can be run directly

```bash
node node_modules\bgsminer\start
```

## Descriptions

The script logic is very simple and we can divide it into 4 parts.

1. Configuration. In order to start one should enter the following to “config.js” file:

- An address to be used for mining
- A private key for this address
- A number of used slots for the epoch (optionally)
- An amount of accrued BTL for withdrawal, hence, the withdrawal will be processed when the entered amount of BTL is achieved  (optionally)
RPC (optionally)
- Mining container ID or "null" for the last container created by the specified address.

2. Registration of a container. At the start the script is checking if the entered address has any containers.  In case containers are available, the script always uses the first container from the list (a smart contract returns the list from the last to the first, which means that a container with the bigger ID will be at the beginning of the list). If there are no containers, the script sends automatically a transaction for its creation and waits for a container to be created. As soon as a container is created a space reservation starts.

3. Mining. Once per each 15 seconds the script is checking the number of the current epoch. In case it is bigger than the previous one, the script sends a transaction for mining, with the features mentioned in a Config file. Hence, we get 1 transaction per an epoch.

4.BTL Withdrawal. As soon as the quantity of accrued for withdrawal BTL tokens exceeds the set up number in Settings, the withdrawal to the entered address is processed automatically.

## License

[MIT](https://choosealicense.com/licenses/mit/)
