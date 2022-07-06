/* eslint-disable prefer-const */
import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { User, CakePool } from "../generated/schema";
import { Deposit, Lock, NewMaxLockDuration, Unlock } from "../generated/CakePool/CakePool";
import { getOrCreateUser, ZERO_BI } from "./utils";

export function startCountdown(event: NewMaxLockDuration): void {
    log.warning("NewMaxLockDuration: {}", [event.params.maxLockDuration.toString()]);
    // let cakePool = CakePool.load("1");
    // //Start calculation when first time max duration of 52 weeks was set up
    // if (cakePool === null && event.params.maxLockDuration.equals(BigInt.fromI32(31536000))) {
    //     cakePool = new CakePool("1");
    //     cakePool.creationTimestamp = event.block.timestamp;
    //     cakePool.blockNumber = event.block.number;
    //     cakePool.totalLocked = ZERO_BI;
    //     cakePool.maxLockDuration = event.params.maxLockDuration;
    //     cakePool.updatedAt = event.block.timestamp;
    //     cakePool.save();
    // }
}

export function handleBlock(event: ethereum.Block): void {
    log.info("HandleBlock. Start. Block - {}", [event.number.toString()]);

}