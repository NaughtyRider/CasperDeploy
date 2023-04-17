import { config } from "dotenv";
config({ path: ".env.cep47" });
import { CEP47Client, CEP47Events, CEP47EventParser } from "casper-cep47-js-client";
import { parseTokenMeta, sleep, getDeploy, getAccountInfo, getAccountNamedKeyValue } from "../utils";

import {
  CLValueBuilder,
  Keys,
  CLPublicKey,
  CLAccountHash,
  CLPublicKeyType,
  DeployUtil,
  EventStream,
  EventName,
  CLValueParsers,
  CLMap,
} from "casper-js-sdk";

const {
  NODE_ADDRESS,
  EVENT_STREAM_ADDRESS,
  CHAIN_NAME,
  WASM_PATH,
  MASTER_KEY_PAIR_PATH,
  USER_KEY_PAIR_PATH,
  TOKEN_NAME,
  CONTRACT_NAME,
  TOKEN_SYMBOL,
  CONTRACT_HASH,
  INSTALL_PAYMENT_AMOUNT,
  MINT_ONE_PAYMENT_AMOUNT,
  MINT_COPIES_PAYMENT_AMOUNT,
  TRANSFER_ONE_PAYMENT_AMOUNT,
  BURN_ONE_PAYMENT_AMOUNT,
  MINT_ONE_META_SIZE,
  MINT_COPIES_META_SIZE,
  MINT_COPIES_COUNT,
  MINT_MANY_META_SIZE,
  MINT_MANY_META_COUNT,
} = process.env;

const KEYS = Keys.Ed25519.parseKeyFiles(
  `${MASTER_KEY_PAIR_PATH}/public_key.pem`,
  `${MASTER_KEY_PAIR_PATH}/secret_key.pem`
);

const KEYS_USER = Keys.Ed25519.parseKeyFiles(
  `${USER_KEY_PAIR_PATH}/public_key.pem`,
  `${USER_KEY_PAIR_PATH}/secret_key.pem`
);

const test = async () => {
  const cep47 = new CEP47Client(
    NODE_ADDRESS!,
    CHAIN_NAME!
  );
  console.log(`Time: ${new Date()}`);

  let accountInfo = await getAccountInfo(NODE_ADDRESS!, KEYS.publicKey);

  console.log(`... Account Info: `);
  console.log(JSON.stringify(accountInfo, null, 2));
   //const contractHash = "hash-a6a6d8de25fcc3422ab9479535989337134ac5acd71ca1929d5179186c3404ee";
  const contractHash = await getAccountNamedKeyValue(
    accountInfo,
    `Auction_auction_contract_hash`
  );
  // const contractPackageHash = "hash-d67bbc4847f55ab95e41e4f165911c3e99d2e0931a7079e9d574ab64fbc5cf17"; //item 40 
  const contractPackageHash = await getAccountNamedKeyValue(
    accountInfo,
    `Auction_auction_package_hash`
  );

  console.log(`... Contract Hash: ${contractHash}`);
  console.log(`... Contract Package Hash: ${contractPackageHash}`);

  await cep47.setContractHash(contractHash, contractPackageHash);

  await sleep(5 * 1000);

  const es = new EventStream(EVENT_STREAM_ADDRESS!);

  es.subscribe(EventName.DeployProcessed, (event) => {
    const parsedEvents = CEP47EventParser({
      contractPackageHash, 
      eventNames: [
        CEP47Events.MintOne,
        CEP47Events.TransferToken,
        CEP47Events.BurnOne,
        CEP47Events.MetadataUpdate,
        CEP47Events.ApproveToken
      ]
    }, event);

    if (parsedEvents && parsedEvents.success) {
      console.log("*** EVENT ***");
      console.log(parsedEvents.data);
      console.log("*** ***");
    }
  });

  es.start();

  const reserve_price = await cep47.reserve_price();
  console.log(`... Contract reserve_price: ${reserve_price}`);
  let StartTime = await cep47.get_start();
  console.log(`... Auction Start Time: ${StartTime}`);
  let endtime = await cep47.get_end();
  console.log(`... Auction End Time: ${endtime}`);

  //****************//
  //* INIT Section *//
  //****************//
  console.log('\n*************************\n');

  console.log('... Init token one \n');

  const mintDeploy = await cep47.init(
    contractPackageHash,
    contractHash,
    MINT_ONE_PAYMENT_AMOUNT!,
    KEYS.publicKey,
    [KEYS]
  );

  const mintDeployHash = await mintDeploy.send(NODE_ADDRESS!);

  console.log("...... Init deploy hash: ", mintDeployHash);

  await getDeploy(NODE_ADDRESS!, mintDeployHash);
  console.log("...... Init successful");

 
  console.log('\n*************************\n');
};

test();

//https://testnet.cspr.live/deploy/3eecefcb58ec1f767bf4554da5446d4ac56ca91670f443c735e2756fd5f215a4