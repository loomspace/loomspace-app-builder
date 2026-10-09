import { grantCredits } from "../src/lib/loomspace-ownership.ts";

const [ownerDid, amountText, reference] = process.argv.slice(2);
const amountMicrocredits = Number(amountText);
if (!ownerDid || !Number.isSafeInteger(amountMicrocredits) || amountMicrocredits <= 0 || !reference) {
  console.error("Usage: node --experimental-strip-types scripts/grant-credits.mjs <privy-did> <positive-integer-microcredits> <reference>");
  process.exitCode = 1;
} else {
  grantCredits(ownerDid, amountMicrocredits, reference);
  console.log("Credit grant recorded.");
}
