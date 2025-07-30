require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const simpleGit = require("simple-git");
const rimraf = require("rimraf");
const fs = require("fs");
const os = require("os");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_FILES = 5;

async function detectAIwithOpenAI(code) {
  const snippet = code.length > 1500 ? code.slice(0, 1500) : code;

  const prompt = `
Is the following code snippet likely AI-generated or human-written? Reply with ONLY "AI" or "Human".

Code:
${snippet}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 3,
      temperature: 0,
    });

    const answer = response.choices[0].message.content.trim();
    if (answer.toLowerCase() === "ai") return 100;
    if (answer.toLowerCase() === "human") return 0;
    return 50;
  } catch (err) {
    console.error("OpenAI API error:", err.message);
    return 0;
  }
}

app.post("/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Repository URL required" });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));

  try {
    const git = simpleGit();
    await git.clone(url, tmpDir);

    let totalScore = 0;
    let fileCount = 0;
    let results = {};
    let scannedFiles = 0;

    async function walk(dir) {
      const files = fs.readdirSync(dir);
      for (let file of files) {
        if (scannedFiles >= MAX_FILES) return;

        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);

        if (stat.isDirectory()) {
          await walk(filepath);
        } else {
          if (/\.(js|ts|py|java|cpp|c|html)$/.test(file)) {
            scannedFiles++;
            console.log(`Analyzing file ${scannedFiles}/${MAX_FILES}: ${filepath}`);

            const code = fs.readFileSync(filepath, "utf8");
            const score = await detectAIwithOpenAI(code);

            results[filepath.replace(tmpDir, "")] = score;
            totalScore += score;
            fileCount++;
          }
        }
      }
    }

    await walk(tmpDir);

    const repoScore = fileCount ? (totalScore / fileCount).toFixed(2) : 0;
    res.json({
      repo_score: repoScore,
      files: results,
      analyzed_files: fileCount,
      max_files: MAX_FILES,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    rimraf.sync(tmpDir);
  }
});

app.listen(8080, () => {
  console.log("backend running on http://localhost:8080");
});