/* eslint-disable prefer-const */
import {BlockInfo, CakePool, User} from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export let ZERO_BI = BigInt.fromI32(0);

export function getOrCreateUser(id: string): User {
  let cakePool = CakePool.load("1");
  let user = User.load(id);
  if (user === null) {
    user = new User(id);
    user.lockStartTime = ZERO_BI;
    user.lockEndTime = ZERO_BI;
    user.totalLocked = ZERO_BI;
    user.duration = ZERO_BI;
    user.locked = false;
    user.unlockedByUser = false;
    user.cakePool = cakePool.id;
    user.save();
  }
  return user as User;
}