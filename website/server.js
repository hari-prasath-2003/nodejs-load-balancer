import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const DIST_PATH = path.join(process.cwd(), "dist");

app.use("/web", express.static(DIST_PATH));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
