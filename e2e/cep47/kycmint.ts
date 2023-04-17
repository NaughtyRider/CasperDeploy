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
    `KYC_contract_hash`
  );
  const contractPackageHash = "hash-8d9ae0b698703292fdc618a35f99ef0b3ad75edb2a1fc3a976372cbc7ea87246";
  // const contractPackageHash = await getAccountNamedKeyValue(
  //   accountInfo,
  //   `${CONTRACT_NAME!}_contract_package_hash`
  // );

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

  const name = await cep47.name();
  console.log(`... Contract name: ${name}`);

  const symbol = await cep47.symbol();
  console.log(`... Contract symbol: ${symbol}`);

  const meta = await cep47.meta();
  console.log(`... Contract meta: ${JSON.stringify(meta)}`);

  let totalSupply = await cep47.totalSupply();
  console.log(`... Total supply: ${totalSupply}`);
  

  console.log('\n*************************\n');

  console.log('... Mint in Kyc \n');

  const mintDeploy = await cep47.mint(
    KEYS.publicKey,
    ["1"],
    [new Map([['number', 'one']])],
    MINT_ONE_PAYMENT_AMOUNT!,
    KEYS.publicKey,
    [KEYS]
  );

  const mintDeployHash = await mintDeploy.send(NODE_ADDRESS!);

  console.log("...... MintKyc deploy hash: ", mintDeployHash);

  await getDeploy(NODE_ADDRESS!, mintDeployHash);
  console.log("...... Minting successfully");
    //* Checks after mint *//
    const balanceOf1 = await cep47.balanceOf(KEYS.publicKey);

    console.log('...... Balance of master account: ', balanceOf1);
  
    const ownerOfTokenOne = await cep47.getOwnerOf("1");
  
    console.log('...... Owner of token one: ', ownerOfTokenOne);
  
    const tokenOneMeta = await cep47.getTokenMeta("1");
  
    console.log('...... Token five metadata: ', tokenOneMeta);
  
    const indexByToken1 = await cep47.getIndexByToken(KEYS.publicKey, "1");
    console.log('...... index of token one: ', indexByToken1);



  console.log('\n*************************\n');
};

test();

//https://testnet.cspr.live/deploy/9101a8dfc26974703855009491c2a5dcacdc1117dad50980f57284e13c79d41a