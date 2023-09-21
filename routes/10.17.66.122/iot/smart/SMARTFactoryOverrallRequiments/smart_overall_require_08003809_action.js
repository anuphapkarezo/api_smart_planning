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

// DELETE route to delete data
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `delete
      from
      smart_overall_require_08003809_action
      where
        id = $1;
        `,
      [id]
    );

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting data" });
  }
});

// UPDATE route to UPDATE data
// UPDATE route to UPDATE data
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      aspects,
      this_years_target,
      improvement,
      update,
      status,
      check_point,
      link,
    } = req.body;

    let queryStr = `UPDATE
      smart_overall_require_08003809_action
    SET
      this_years_target = $1,
      improvement = $2,
      "update" = $3,
      status = $4,
      check_point = $5,
      link = $6`;

    const queryParams = [
      this_years_target,
      improvement,
      update,
      status,
      check_point,
      link,
    ];

    if (status === "Done") {
      queryStr += `,
      finished = now()`;
    }

    queryStr += `
    WHERE
      id = $7;
    `;
    queryParams.push(id);

    const result = await query(queryStr, queryParams);
    // Update this_years_target to 0 where aspects matches
    const updateResult = await query(
      `UPDATE smart_overall_require_08003809_action
       SET this_years_target = $1
       WHERE aspects = $2`,
      [this_years_target, aspects]
    );
    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

// ADD route to ADD data
router.post("/", async (req, res) => {
  try {
    const {
      no,
      aspects,
      this_years_target,
      sub_sub_no,
      improvement,
      update,
      status,
      check_point,
      link,
    } = req.body;

    const result = await query(
      `INSERT INTO smart_overall_require_08003809_action
      ("no",
      aspects,
      this_years_target,
      sub_sub_no,
      improvement,
      "update",
      status,
      check_point,
      link)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        no,
        aspects,
        this_years_target,
        sub_sub_no,
        improvement,
        update,
        status,
        check_point,
        link,
      ]
    );

    // Update this_years_target to 0 where aspects matches
    const updateResult = await query(
      `UPDATE smart_overall_require_08003809_action
       SET this_years_target = $1
       WHERE aspects = $2`,
      [this_years_target, aspects]
    );

    res.status(201).json({ message: "Data added and updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

//Page2
router.get("/page2/table", async (req, res) => {
  try {
    const queryStr = `
    -- ข้อมูลปกติที่มีในต้นแบบ SQL ของคุณ
    SELECT
    row_number() over () as id,
    t2.no,
    t2.aspects,
    t1.this_years_target,
    t1.actioncount,
    t2.count,
    t2.score_1_count,
    t2.score_0_count,
    t2.score_1_percentage,
    t2.score_0_percentage
FROM (
    SELECT
        no,
        aspects,
       COUNT(CASE WHEN sub_sub_no IS NOT NULL THEN 1 ELSE NULL END) AS actioncount,
        this_years_target
    FROM
        smart.smart_overall_require_08003809_action
--         where 
--         sub_sub_no is not null
    GROUP BY
        no,
        aspects,
        this_years_target
) t1
JOIN (
    SELECT
        no,
        aspects,
        COUNT(*) as count,
        SUM(CASE WHEN score > 0 THEN score ELSE 0 END) as score_1_count,
        SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as score_0_count,
        (SUM(CASE WHEN score > 0 THEN score ELSE 0 END) * 100.0) / COUNT(*) as score_1_percentage,
        (SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(*) as score_0_percentage
    FROM
        smart.smart_overall_require_08003809
    GROUP BY
        no,
        aspects
) t2 ON t1.no = t2.no AND t1.aspects = t2.aspects

UNION ALL

-- แถวที่มีชื่อ "total" และคำนวณค่ารวม
SELECT
    count(*)+1 as id,
    count(*)+1 as no,
    'total' as aspects,
    SUM(t1.this_years_target) / COUNT(*) as this_years_target,
    SUM(t1.actioncount) as actioncount,
    SUM(t2.count) as count,
    SUM(t2.score_1_count) as score_1_count,
    SUM(t2.score_0_count) as score_0_count,
    (SUM(t2.score_1_count) * 100.0) / SUM(t2.count) as score_1_percentage,
    (SUM(t2.score_0_count) * 100.0) / SUM(t2.count) as score_0_percentage
FROM (
    SELECT
        no,
        aspects,
        COUNT(*) as count,
        SUM(CASE WHEN score > 0 THEN score ELSE 0 END) as score_1_count,
        SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as score_0_count
    FROM
        smart.smart_overall_require_08003809
    GROUP BY
        no,
        aspects
) t2
JOIN (
    SELECT
        no,
        aspects,
         COUNT(CASE WHEN sub_sub_no IS NOT NULL THEN 1 ELSE NULL END) AS actioncount,
        this_years_target
    FROM
        smart.smart_overall_require_08003809_action
    GROUP BY
        no,
        aspects,
        this_years_target
) t1 ON t1.no = t2.no AND t1.aspects = t2.aspects

ORDER BY
    no ASC, aspects DESC; -- เรียงลำดับตามเลขที่และชื่อ aspects     
    `;

    const result = await query(queryStr);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page2/tableaction", async (req, res) => {
  try {
    const { aspects } = req.query;

    let queryStr = `
    select
     *
    from
      smart.smart_overall_require_08003809_action
    `;

    let queryParams = [];

    if (aspects !== "total") {
      queryStr += `
        where
          aspects = $1
      `;
      queryParams.push(aspects);
    }

    queryStr += `
    order by sub_sub_no asc
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
