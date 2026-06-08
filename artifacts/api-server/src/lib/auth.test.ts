import assert from "node:assert/strict";

process.env["DATABASE_URL"] = "postgres://user:password@localhost:5432/zak_auth_test";
process.env["ZAK_AUTH_SECRET"] = "test-secret";

const { createAuthToken, hashPassword, verifyAuthToken, verifyPassword } = await import("./auth");

const passwordHash = await hashPassword("PasswordSicura123!");
assert.equal(await verifyPassword("PasswordSicura123!", passwordHash), true);
assert.equal(await verifyPassword("password-errata", passwordHash), false);
assert.equal(await verifyPassword("PasswordSicura123!", null), false);

const session = createAuthToken({
  id: "utente-1",
  nome: "Admin Test",
  email: "admin@test.local",
  ruolo: "admin",
  stato: "attivo",
});
const payload = verifyAuthToken(session.token);
assert.equal(payload?.sub, "utente-1");
assert.equal(payload?.ruolo, "admin");

const tampered = `${session.token.slice(0, -1)}x`;
assert.equal(verifyAuthToken(tampered), null);

console.log("Auth tests passed (password hash and signed token).");
