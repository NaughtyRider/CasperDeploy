import { Keys } from "casper-js-sdk";
import { CasperContractClient, types } from "casper-js-client-helper";
declare type RecipientType = types.RecipientType;
declare class ERC20Client extends CasperContractClient {
    protected namedKeys?: {
        allowances: string;
        balances: string;
    };
    install(keys: Keys.AsymmetricKey, tokenName: string, tokenSymbol: string, tokenDecimals: string, tokenTotalSupply: string, paymentAmount: string, wasmPath: string): Promise<string>;
    setContractHash(hash: string): Promise<void>;
    name(): Promise<any>;
    symbol(): Promise<any>;
    decimals(): Promise<any>;
    totalSupply(): Promise<any>;
    transfer(keys: Keys.AsymmetricKey, recipient: RecipientType, transferAmount: string, paymentAmount: string, ttl?: number): Promise<string>;
    transferFrom(keys: Keys.AsymmetricKey, owner: RecipientType, recipient: RecipientType, transferAmount: string, paymentAmount: string, ttl?: number): Promise<string>;
    approve(keys: Keys.AsymmetricKey, spender: RecipientType, approveAmount: string, paymentAmount: string, ttl?: number): Promise<string>;
    balanceOf(account: RecipientType): Promise<any>;
    allowances(owner: RecipientType, spender: RecipientType): Promise<any>;
}
export default ERC20Client;
