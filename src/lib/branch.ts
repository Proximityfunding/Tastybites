import { db } from "./db";

/** Single-branch v1: resolves the one store branch. Multi-branch UI can replace this later. */
export async function getDefaultBranch() {
  return db.branch.findFirstOrThrow();
}
