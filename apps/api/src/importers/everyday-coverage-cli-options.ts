export type EverydayCoverageCliOptions = {
  blsFile: string;
  srDirectory: string;
  foundationDirectory: string;
  snapshotFile?: string;
  apply: boolean;
  confirmation?: string;
  batchSize: number;
};

export function parseEverydayCoverageCliOptions(args: readonly string[]): EverydayCoverageCliOptions {
  const value = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
  const blsFile = value("--bls");
  const srDirectory = value("--usda-sr");
  const foundationDirectory = value("--usda-foundation");
  const snapshotFile = value("--snapshot");
  const apply = args.includes("--apply");
  const confirmation = value("--confirm");
  const batchSize = Number(value("--batch-size") ?? 75);
  if (!blsFile || !srDirectory || !foundationDirectory) {
    throw new Error("Usage: catalog:coverage --bls <BLS xlsx> --usda-sr <SR Legacy dir> --usda-foundation <Foundation dir> [--snapshot <read-only catalog json>] [--batch-size 50-100] [--apply --confirm everyday-coverage-v2]");
  }
  if (!Number.isInteger(batchSize) || batchSize < 50 || batchSize > 100) throw new Error("batch size must be an integer from 50 to 100");
  if (apply && confirmation !== "everyday-coverage-v2") throw new Error("write mode requires --apply --confirm everyday-coverage-v2");
  if (apply && snapshotFile) throw new Error("snapshot inspection is dry-run only and cannot be combined with --apply");
  return { blsFile, srDirectory, foundationDirectory, snapshotFile, apply, confirmation, batchSize };
}
