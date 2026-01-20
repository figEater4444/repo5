import express from "express";
import cors from "cors";
import { Firestore, FieldValue } from "@google-cloud/firestore";

const app = express();
app.use(express.json());

// IMPORTANT: lock CORS to your GitHub Pages origin
app.use(
  cors({
    origin: [
      "https://figeater4444.github.io",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
  })
);

const db = new Firestore();
const col = db.collection("items");

// Health check
app.get("/", (req, res) => res.json({ ok: true, service: "repo5-backend" }));

// Create
app.post("/api/items", async (req, res) => {
  const { title, data } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });

  const docRef = await col.add({
    title,
    data: data ?? null,
    createdAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: docRef.id });
});

// Read all
app.get("/api/items", async (req, res) => {
  const snap = await col.orderBy("createdAt", "desc").limit(50).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(items);
});

// Read one
app.get("/api/items/:id", async (req, res) => {
  const doc = await col.doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "not found" });
  res.json({ id: doc.id, ...doc.data() });
});

// Update
app.put("/api/items/:id", async (req, res) => {
  const { title, data } = req.body || {};
  await col.doc(req.params.id).set(
    { title, data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  res.json({ ok: true });
});

// Delete
app.delete("/api/items/:id", async (req, res) => {
  await col.doc(req.params.id).delete();
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`listening on ${port}`));
