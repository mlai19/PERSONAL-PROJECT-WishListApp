const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

const apiKey = "59914157de9245cf95b6fb66e610c51e"; // ← MAKE SURE THIS IS VALID


app.post("/preview", async (req, res) => {
  const { url } = req.body;
  try {
    const response = await axios.get(`https://api.linkpreview.net/?key=${apiKey}&q=${url}`);
    res.json({ image: response.data.image });
  } catch (error) {
    console.error("Preview API failed:", error.response?.status || error.message);
    res.status(500).json({ error: "Preview failed" });
  }
});

app.listen(5001, () => {
  console.log("Server running on port 5001");
});
