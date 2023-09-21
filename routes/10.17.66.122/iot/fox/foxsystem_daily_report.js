const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  host: "10.17.66.122",
  port: 5432,
  user: "postgres",
  password: "p45aH9c17hT11T{]",
  database: "iot",
});

const query = (text, params) => pool.query(text, params);

router.get("/TableData", async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
  id,
  "date",
  product,
  test_station,
  fox_qty,
  mes_qty,
  ROUND(CAST(match_rate AS numeric), 1) AS match_rate
FROM
  fox.foxsystem_daily_report fdr
WHERE
  fox_qty > 5
  AND match_rate > 1
  AND "date"::date = (current_date - interval '1' day)::date;

    `
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
