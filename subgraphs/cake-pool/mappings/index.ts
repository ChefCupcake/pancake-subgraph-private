/* eslint-disable prefer-const */
import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { User, CakePool } from "../generated/schema";
import { Deposit, Lock, NewMaxLockDuration, Unlock } from "../generated/CakePool/CakePool";
import { getOrCreateBlockInfo, getOrCreateUser, ZERO_BI } from "./utils";

//600 block it's around 30 min
let BLOCK_ITERATION_STEP_BI = BigInt.fromI32(600);

export function startCountdown(event: NewMaxLockDuration): void {
    let cakePool = CakePool.load("1");
    log.warning("NewMaxLockDuration: {}", [event.params.maxLockDuration.toString()]);
    //Start calculation when first time max duration of 52 weeks was set up
    if (cakePool === null && event.params.maxLockDuration.equals(BigInt.fromI32(31536000))) {
        cakePool = new CakePool("1");
        cakePool.creationTimestamp = event.block.timestamp;
        cakePool.blockNumber = event.block.number;
        cakePool.totalLocked = ZERO_BI;
        cakePool.maxLockDuration = event.params.maxLockDuration;
        cakePool.updatedAt = event.block.timestamp;
        cakePool.save();
    }
}

export function handleDeposit(event: Deposit): void {
    let cakePool = CakePool.load("1");
    if (cakePool !== null) {
        cakePool.updatedAt = event.block.timestamp;
        cakePool.save();
        let user = getOrCreateUser(event.params.sender.toHex());
        log.info("Deposit. Duration - {}. Lock amount - {}", [
          event.params.duration.toString(),
          event.params.amount.toString(),
        ]);

        if (event.params.duration.gt(ZERO_BI)) {
            if (user.lockEndTime < event.block.timestamp) {
                user.lockStartTime = event.block.timestamp;
                user.lockEndTime = event.block.timestamp.plus(event.params.duration);
              } else {
                user.lockEndTime = user.lockEndTime.plus(event.params.duration);
            }
            user.cakePool = cakePool.id;
        } else {
            if (user.totalLocked.gt(ZERO_BI)) {
                user.totalLocked = user.totalLocked.plus(event.params.amount);
                cakePool.totalLocked = cakePool.totalLocked.plus(event.params.amount);
            }
            user.cakePool = cakePool.id;
        }

        user.save();
    }
}

export function handleLock(event: Lock): void {
    let cakePool = CakePool.load("1");
    if (cakePool !== null) {
        let user = getOrCreateUser(event.params.sender.toHex());
        log.info("Lock. Duration - {}. Lock amount - {}", [
          event.params.lockedDuration.toString(),
          event.params.lockedAmount.toString(),
        ]);
    
        cakePool.totalLocked = cakePool.totalLocked.minus(user.totalLocked).plus(event.params.lockedAmount);
        cakePool.updatedAt = event.block.timestamp;
        cakePool.save();
    
        user.totalLocked = event.params.lockedAmount;
        user.duration = event.params.lockedDuration;
        user.unlockedByUser = false;
        user.locked = true;
        user.save();
      }
}

export function handleUnlock(event: Unlock): void {
    let cakePool = CakePool.load("1");
    if (cakePool !== null) {
        let user = getOrCreateUser(event.params.sender.toHex());
        log.info("Unlock. Amount - {}", [event.params.amount.toString()]);
    
        user.locked = false;
        user.unlockedByUser = true;
        user.lockStartTime = ZERO_BI;
        user.lockEndTime = ZERO_BI;
    
        user.save();
      }
}

export function handleBlock(event: ethereum.Block): void {
    log.info("HandleBlock. Timestamp - {}", [event.timestamp.toString()]);

    let blockInfo = getOrCreateBlockInfo();
    if (event.number.minus(blockInfo.lastBlockNumber).gt(BLOCK_ITERATION_STEP_BI)) {
        blockInfo.lastBlockNumber = event.number;
        blockInfo.save();

        let cakePool = CakePool.load("1");
        if (cakePool !== null) {
            let users = cakePool.users;
            if (users !== null) {
                let userCount = cakePool.users.length;
                log.info("HandleBlock. Users found. Length - {}", [userCount.toString()]);
                for (let i = 0; i < userCount; i++) {
                    let user = User.load((users as Array<string>)[i].toString());
                    if (user !== null) {
                    if (user.lockEndTime.notEqual(ZERO_BI) && user.lockEndTime < event.timestamp) {
                        cakePool.totalLocked = cakePool.totalLocked.minus(user.totalLocked);
            
                        user.locked = false;
                        user.unlockedByUser = false;
                        user.cakePool = '';
                        user.totalLocked = ZERO_BI;
                        user.lockStartTime = ZERO_BI;
                        user.lockEndTime = ZERO_BI;
                        user.save();
                    }
                    }
                }
            } else {
                log.error("HandleBlock. No users found. {}", ["0"]);
            }
            cakePool.save();
        }
    }
    log.info("HandleBlock. End. Timestamp - {}", [event.timestamp.toString()]);
}