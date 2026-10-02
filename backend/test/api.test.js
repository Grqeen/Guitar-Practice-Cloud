import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("schémas Mongoose et relation", () => {
  const u = new User({
    name: "Test",
    email: "TEST@example.com",
    password: "12345678",
  });

  assert.equal(u.email, "test@example.com");
  const t = new Track({
    ownerId: new mongoose.Types.ObjectId(),
    title: "Blues",
    originalName: "b.mp3",
    storedName: "x.mp3",
    mimeType: "audio/mpeg",
    size: 42,
  });
  
  assert.equal(t.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

test("route protégée /api/users/me renvoie 401 sans header Authorization", async () => {
  const r = await fetch(base + "/api/users/me");
  assert.equal(r.status, 401);
  const data = await r.json();
  assert.match(data.message, /Authentification requise/i);
});

test("route protégée /api/tracks renvoie 401 avec un JWT invalide", async () => {
  const r = await fetch(base + "/api/tracks", {
    headers: { Authorization: "Bearer mauvais-jeton-invalide" },
  });
  assert.equal(r.status, 401);
  const data = await r.json();
  assert.match(data.message, /invalide/i);
});

import jwt from "jsonwebtoken";

const testSecret = process.env.JWT_SECRET || "tp1-development-secret";
const validToken = jwt.sign(
  { sub: new mongoose.Types.ObjectId().toString(), email: "tester@example.com" },
  testSecret,
  { expiresIn: "1h" },
);

test("route protégée DELETE /api/tracks/:id renvoie 401 sans jeton", async () => {
  const r = await fetch(base + "/api/tracks/track-123", {
    method: "DELETE",
  });
  assert.equal(r.status, 401);
});

test("upload multipart sans fichier audio renvoie 400 Bad Request", async () => {
  const form = new FormData();
  form.append("title", "Morceau sans audio");

  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${validToken}` },
    body: form,
  });

  assert.equal(r.status, 400);
  const data = await r.json();
  assert.match(data.message, /Fichier audio requis/i);
});

test("upload avec type MIME refusé renvoie 400 Bad Request", async () => {
  const form = new FormData();
  form.append("title", "Test MIME invalide");
  const badBlob = new Blob(["ceci n'est pas du son"], { type: "text/plain" });
  form.append("audio", badBlob, "notes.txt");

  const r = await fetch(base + "/api/tracks", {
    method: "POST",
    headers: { Authorization: `Bearer ${validToken}` },
    body: form,
  });

  assert.equal(r.status, 400);
  const data = await r.json();
  assert.match(data.message, /Format audio non accepté/i);
});

test("route protégée GET /api/tracks/:id/audio renvoie 401 sans jeton", async () => {
  const r = await fetch(base + "/api/tracks/track-123/audio");
  assert.equal(r.status, 401);
});

test("route protégée GET /api/tracks/:id/cover renvoie 401 sans jeton", async () => {
  const r = await fetch(base + "/api/tracks/track-123/cover");
  assert.equal(r.status, 401);
});




