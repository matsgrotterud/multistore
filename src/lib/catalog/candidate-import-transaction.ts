export const CANDIDATE_IMPORT_CLAIM_STATUS = "IMPORTING" as const;

export interface CandidateImportState {
  status: string;
  importedProductId: string | null;
}

export interface CandidateImportTransactionResult {
  productId: string;
  replayed: boolean;
}

export interface AtomicCandidateImportInput<TTransaction> {
  candidateId: string;
  supplierIdentityLabel: string;
  withTransaction: <T>(
    operation: (transaction: TTransaction) => Promise<T>
  ) => Promise<T>;
  claimCandidate: (transaction: TTransaction) => Promise<number>;
  readCandidateState: (
    transaction: TTransaction
  ) => Promise<CandidateImportState | null>;
  assertImportedProductIdentity: (
    transaction: TTransaction,
    productId: string
  ) => Promise<void>;
  findSupplierIdentityProductIds: (
    transaction: TTransaction
  ) => Promise<string[]>;
  createProductGraph: (transaction: TTransaction) => Promise<string>;
  finalizeCandidate: (
    transaction: TTransaction,
    productId: string
  ) => Promise<number>;
}

/**
 * Import one candidate inside the caller's real database transaction.
 *
 * APPROVED -> IMPORTING is an exact compare-and-swap claim. Product, variants,
 * media, gallery rows and IMPORTED are then committed together. A thrown error
 * at any point must therefore roll back both the claim and every child row.
 */
export async function executeAtomicCandidateImport<TTransaction>(
  input: AtomicCandidateImportInput<TTransaction>
): Promise<CandidateImportTransactionResult> {
  return input.withTransaction(async (transaction) => {
    const claimed = await input.claimCandidate(transaction);
    if (claimed === 0) {
      const current = await input.readCandidateState(transaction);
      if (current?.status === "IMPORTED" && current.importedProductId) {
        await input.assertImportedProductIdentity(
          transaction,
          current.importedProductId
        );
        return {
          productId: current.importedProductId,
          replayed: true,
        };
      }

      throw new Error(
        `Candidate ${input.candidateId} import claim failed from ${
          current?.status ?? "MISSING"
        }. Retry only an unchanged APPROVED candidate.`
      );
    }
    if (claimed !== 1) {
      throw new Error(
        `Candidate ${input.candidateId} import claim affected ${claimed} rows; expected exactly one.`
      );
    }

    const existingProductIds = await input.findSupplierIdentityProductIds(
      transaction
    );
    if (existingProductIds.length > 0) {
      throw new Error(
        `Candidate ${input.candidateId} import blocked: supplier identity ${input.supplierIdentityLabel} already belongs to product ${existingProductIds.join(
          ","
        )}. Reconcile the existing product before retrying.`
      );
    }

    const productId = await input.createProductGraph(transaction);
    const finalized = await input.finalizeCandidate(transaction, productId);
    if (finalized !== 1) {
      throw new Error(
        `Candidate ${input.candidateId} import finalization affected ${finalized} rows; the product graph was rolled back.`
      );
    }

    return { productId, replayed: false };
  });
}

