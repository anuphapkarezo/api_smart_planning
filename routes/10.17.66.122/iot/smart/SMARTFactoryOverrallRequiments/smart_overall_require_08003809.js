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

router.get("/page1/raderchart", async (req, res) => {
  try {
    const queryStr = `
    WITH main_query AS (
      SELECT
          ROW_NUMBER() OVER () AS id,
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
  ),
  max_no AS (
      SELECT MAX(no) FROM main_query
  )
  SELECT
      ROW_NUMBER() OVER () + (SELECT MAX(id) FROM main_query) AS id,
      (SELECT MAX(no) + 1 FROM max_no) AS no,
      'Total' AS aspects,
      COUNT(*) as count,
      SUM(CASE WHEN score > 0 THEN score ELSE 0 END) as score_1_count,
      SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as score_0_count,
      (SUM(CASE WHEN score > 0 THEN score ELSE 0 END) * 100.0) / COUNT(*) as score_1_percentage,
      (SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(*) as score_0_percentage
  FROM
      smart.smart_overall_require_08003809
  UNION ALL
  SELECT * FROM main_query
  ORDER BY no;  
    `;

    const result = await query(queryStr);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/pieemailplot", async (req, res) => {
  try {
    const { aspects, aspect, dept_concern } = req.query;

    let queryStr = `
    select
	email,
	COUNT(email) as result_count_status
from
	smart.smart_overall_require_08003809
    `;

    let queryParams = [];

    // Check if aspects is equal to '-'
    if (aspects !== "-") {
      queryStr += `
        where
          aspects = $1
      `;
      queryParams.push(aspects);
    }

    if (aspect !== "ALL") {
      queryStr += `
        ${queryParams.length > 0 ? "AND" : "where"} aspect = $${
        queryParams.length + 1
      }
      `;
      queryParams.push(aspect);
    }

    if (dept_concern !== "ALL") {
      queryStr += `
        ${queryParams.length > 0 ? "AND" : "where"} dept_concern = $${
        queryParams.length + 1
      }
      `;
      queryParams.push(dept_concern);
    }

    queryStr += `
    group by 
    email
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/distinctaspects", async (req, res) => {
  try {
    const result = await query(`
    select
    aspects ,
    no
  from
    smart.smart_overall_require_08003809
  group by
    aspects ,
    no
  order by
    no asc
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/distinctaspect", async (req, res) => {
  try {
    const { aspects } = req.query;

    const queryStr = `
    select
    aspect ,
    no,
    sub_no
  from
    smart.smart_overall_require_08003809
  where
    aspects = $1
  group by
    aspect ,
    no,
    sub_no
  order by
  sub_no asc
    `;
    const queryParams = [aspects];

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/distinctdept_concern", async (req, res) => {
  try {
    const { aspects } = req.query;

    const queryStr = `
    select
    distinct dept_concern 
  from
    smart.smart_overall_require_08003809
  where
    aspects = $1
    `;
    const queryParams = [aspects];

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/table", async (req, res) => {
  try {
    const { aspects, aspect, dept_concern } = req.query;

    let queryStr = `
      select
        id,
        "no",
        aspects,
        sub_no,
        aspect,
        sub_sub_no,
        request,
        score,
        description_proof,
        done,
        total,
        update_by,
        fjk_comment,
        dept_concern,
        email
      from
        smart.smart_overall_require_08003809
    `;

    let queryParams = [];

    // Check if aspects is equal to '-'
    if (aspects !== "-") {
      queryStr += `
        where
          aspects = $1
      `;
      queryParams.push(aspects);
    }

    if (aspect !== "ALL") {
      queryStr += `
        ${queryParams.length > 0 ? "AND" : "where"} aspect = $${
        queryParams.length + 1
      }
      `;
      queryParams.push(aspect);
    }

    if (dept_concern !== "ALL") {
      queryStr += `
        ${queryParams.length > 0 ? "AND" : "where"} dept_concern = $${
        queryParams.length + 1
      }
      `;
      queryParams.push(dept_concern);
    }

    queryStr += `
      order by
        sub_sub_no asc
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// DELETE route to delete data
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `delete
      from
        smart_overall_require_08003809
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
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      no,
      aspects,
      sub_no,
      aspect,
      sub_sub_no,
      request,
      score,
      description_proof,
      done,
      total,
      update_by,
      fjk_comment,
      dept_concern,
      email,
    } = req.body;

    const result = await query(
      `UPDATE smart_overall_require_08003809
       SET
         "no" = $1,
         aspects = $2,
         sub_no = $3,
         aspect = $4,
         sub_sub_no = $5,
         request = $6,
         score = $7,
         description_proof = $8,
         done = $9,
         total = $10,
         update_by = $11,
         fjk_comment = $12,
         dept_concern = $13,
         email = $14,
         update_date = now()
       WHERE id = $15`,
      [
        no,
        aspects,
        sub_no,
        aspect,
        sub_sub_no,
        request,
        score,
        description_proof,
        done,
        total,
        update_by,
        fjk_comment,
        dept_concern,
        email,
        id,
      ]
    );

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

// POST route to insert data
router.post("/", async (req, res) => {
  try {
    const {
      no,
      aspects,
      sub_no,
      aspect,
      sub_sub_no,
      request,
      score,
      description_proof,
      done,
      total,
      update_by,
      fjk_comment,
      dept_concern,
      email,
    } = req.body;
    const result = await query(
      `INSERT INTO smart_overall_require_08003809 (
       "no",
       aspects,
       sub_no,
       aspect,
       sub_sub_no,
       request,
       score,
       description_proof,
       done,
       total,
       update_by,
       fjk_comment,
       dept_concern,
       email,
       create_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())`,
      [
        no,
        aspects,
        sub_no,
        aspect,
        sub_sub_no,
        request,
        score,
        description_proof,
        done,
        total,
        update_by,
        fjk_comment,
        dept_concern,
        email,
      ]
    );

    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

//Page2
// router.get("/page2/table", async (req, res) => {
//   try {
//     const queryStr = `
//     -- ข้อมูลปกติที่มีในต้นแบบ SQL ของคุณ
//     SELECT
//         row_number() over () as id,
//         t2.no,
//         t2.aspects,
//         t1.this_years_target,
//         t2.count,
//         t2.score_1_count,
//         t2.score_0_count,
//         t2.score_1_percentage,
//         t2.score_0_percentage
//     FROM (
//         SELECT
//             no,
//             aspects,
//             this_years_target
//         FROM
//             smart.smart_overall_require_08003809_action
//         GROUP BY
//             no,
//             aspects,
//             this_years_target
//     ) t1
//     JOIN (
//         SELECT
//             no,
//             aspects,
//             COUNT(*) as count,
//             SUM(CASE WHEN score > 0 THEN score ELSE 0 END) as score_1_count,
//             SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as score_0_count,
//             (SUM(CASE WHEN score > 0 THEN score ELSE 0 END) * 100.0) / COUNT(*) as score_1_percentage,
//             (SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(*) as score_0_percentage
//         FROM
//             smart.smart_overall_require_08003809
//         GROUP BY
//             no,
//             aspects
//     ) t2 ON t1.no = t2.no AND t1.aspects = t2.aspects

//     UNION ALL

//     -- แถวที่มีชื่อ "total" และคำนวณค่ารวม
//     SELECT
//         count(*)+1 as id,
//         count(*)+1 as no,
//         'total' as aspects,
//         SUM(t1.this_years_target) / COUNT(*) as this_years_target,
//         SUM(t2.count) as count,
//         SUM(t2.score_1_count) as score_1_count,
//         SUM(t2.score_0_count) as score_0_count,
//         (SUM(t2.score_1_count) * 100.0) / SUM(t2.count) as score_1_percentage,
//         (SUM(t2.score_0_count) * 100.0) / SUM(t2.count) as score_0_percentage
//     FROM (
//         SELECT
//             no,
//             aspects,
//             COUNT(*) as count,
//             SUM(CASE WHEN score > 0 THEN score ELSE 0 END) as score_1_count,
//             SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as score_0_count
//         FROM
//             smart.smart_overall_require_08003809
//         GROUP BY
//             no,
//             aspects
//     ) t2
//     JOIN (
//         SELECT
//             no,
//             aspects,
//             this_years_target
//         FROM
//             smart.smart_overall_require_08003809_action
//         GROUP BY
//             no,
//             aspects,
//             this_years_target
//     ) t1 ON t1.no = t2.no AND t1.aspects = t2.aspects

//     ORDER BY
//         no ASC, aspects DESC; -- เรียงลำดับตามเลขที่และชื่อ aspects
//     `;

//     const result = await query(queryStr);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "An error occurred while fetching data" });
//   }
// });

// router.get("/page2/tableaction", async (req, res) => {
//   try {
//     const { aspects } = req.query;

//     let queryStr = `
//     select
//      *
//     from
//       smart.smart_overall_require_08003809_action
//     `;

//     let queryParams = [];

//     if (aspects !== "total") {
//       queryStr += `
//         where
//           aspects = $1
//       `;
//       queryParams.push(aspects);
//     }

//     queryStr += `
//     order by no asc
//     `;

//     const result = await query(queryStr, queryParams);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "An error occurred while fetching data" });
//   }
// });

router.get("/page2/tablesub_sub_no", async (req, res) => {
  try {
    const { sub_sub_no } = req.query;

    let queryStr = `
    select
	id,
	"no",
	aspects,
	sub_no,
	aspect,
	sub_sub_no,
	request,
	score,
	description_proof,
	done,
	total,
	update_by,
	fjk_comment,
	dept_concern,
	email,
	create_at,
	update_date
from
	smart.smart_overall_require_08003809
    `;

    let queryParams = [];

    if (sub_sub_no !== "total") {
      queryStr += `
        where
        sub_sub_no = $1
      `;
      queryParams.push(sub_sub_no);
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
