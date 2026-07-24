const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Keep costs predictable; adjust as needed.
setGlobalOptions({maxInstances: 10});

/**
 * Callable function: sendNotification
 *
 * Request data shape:
 * {
 *   title: string,   // required
 *   body: string,    // required
 *   data?: object    // optional key/value payload (all values must be strings)
 * }
 *
 * Reads every document in the "users" collection, collects every token
 * found in each document's `fcmTokens` array, sends the notification to
 * all of them, then removes any tokens that FCM reports as invalid /
 * unregistered from the owning user's document.
 *
 * Returns: { successCount, failureCount, invalidTokensRemoved }
 */
exports.sendNotification = onCall(async (request) => {
  // Require the caller to be authenticated. Remove this block if you want
  // to allow unauthenticated calls (not recommended).
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be signed in to send notifications.",
    );
  }

  const {title, body, data} = request.data || {};

  if (!title || typeof title !== "string") {
    throw new HttpsError("invalid-argument", "'title' (string) is required.");
  }
  if (!body || typeof body !== "string") {
    throw new HttpsError("invalid-argument", "'body' (string) is required.");
  }

  // FCM's `data` payload requires every value to be a string.
  const dataPayload = {};
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      dataPayload[key] = String(value);
    }
  }

  // 1. Gather every token across every user, remembering which user
  //    document each token belongs to (so we can clean up later).
  const usersSnapshot = await db.collection("users").get();

  /** @type {Map<string, FirebaseFirestore.DocumentReference>} */
  const tokenToUserRef = new Map();

  usersSnapshot.forEach((doc) => {
    const tokens = doc.data().fcmTokens;
    if (Array.isArray(tokens)) {
      tokens.forEach((token) => {
        if (typeof token === "string" && token.trim().length > 0) {
          tokenToUserRef.set(token, doc.ref);
        }
      });
    }
  });

  const allTokens = Array.from(tokenToUserRef.keys());

  if (allTokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokensRemoved: 0,
      message: "No FCM tokens found on any user document.",
    };
  }

  // 2. FCM's sendEachForMulticast accepts at most 500 tokens per call,
  //    so chunk the token list.
  const CHUNK_SIZE = 500;
  const chunks = [];
  for (let i = 0; i < allTokens.length; i += CHUNK_SIZE) {
    chunks.push(allTokens.slice(i, i + CHUNK_SIZE));
  }

  let totalSuccessCount = 0;
  let totalFailureCount = 0;
  const invalidTokens = [];

  for (const chunk of chunks) {
    const response = await admin.messaging().sendEachForMulticast({
      notification: {title, body},
      data: dataPayload,
      tokens: chunk,
    });

    totalSuccessCount += response.successCount;
    totalFailureCount += response.failureCount;

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error && resp.error.code;
        // These two codes mean the token is dead and should be removed.
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(chunk[idx]);
        }
      }
    });
  }

  // 3. Remove invalid tokens from their owning user documents.
  if (invalidTokens.length > 0) {
    // Group invalid tokens by the user document they belong to, so each
    // document only needs a single update call.
    const byUserPath = new Map();

    invalidTokens.forEach((token) => {
      const userRef = tokenToUserRef.get(token);
      if (!userRef) return;
      if (!byUserPath.has(userRef.path)) {
        byUserPath.set(userRef.path, {ref: userRef, tokens: []});
      }
      byUserPath.get(userRef.path).tokens.push(token);
    });

    const batch = db.batch();
    byUserPath.forEach(({ref, tokens}) => {
      batch.update(ref, {
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
      });
    });
    await batch.commit();
  }

  return {
    successCount: totalSuccessCount,
    failureCount: totalFailureCount,
    invalidTokensRemoved: invalidTokens.length,
  };
});
