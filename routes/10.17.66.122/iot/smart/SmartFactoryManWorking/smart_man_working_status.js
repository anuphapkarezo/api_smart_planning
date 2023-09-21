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

router.get("/default", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT select_date
      FROM smart.smart_man_working_status
      WHERE date_time = (SELECT MAX(date_time) FROM smart.smart_man_working_status);
      `
    );

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/distinct_department", async (req, res) => {
  try {
    const { selectDate } = req.query;

    const result = await pool.query(
      `
      SELECT DISTINCT department 
      FROM smart.smart_man_working_status
      WHERE select_date = $1
      `,
      [selectDate] // Pass the selectDate as a parameter to avoid SQL injection
    );

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// router.get("/result_totalLeave", async (req, res) => {
//   try {
//     const { select_date, department } = req.query;

//     let queryParams = [];
//     let queryStr = `
//     SELECT
//         categories.title,
//         COALESCE(SUM(CASE WHEN sr.con_wk = categories.title THEN 1 ELSE 0 END), 0) AS result
//     FROM
//         (
//             SELECT 'Normal working' AS title
//             UNION ALL
//             SELECT 'OT'
//             UNION ALL
//             SELECT 'Holiday'
//             UNION ALL
//             SELECT 'Repair'
//             UNION ALL
//             SELECT 'Working in line'
//             UNION ALL
//             SELECT 'Roving'
//             UNION ALL
//             SELECT 'Other'
//             UNION ALL
//             SELECT 'Leave 2 Hr'
//             UNION ALL
//             SELECT 'Leave 4 Hr'
//         ) AS categories
//     LEFT JOIN
//         smart.smart_man_working_status AS sr
//         ON categories.title = sr.con_wk
//     `;

//     if (select_date !== "ALL") {
//       queryStr += `
//         AND sr.select_date = $${queryParams.length + 1}
//       `;
//       queryParams.push(select_date);
//     }

//     if (department !== "ALL") {
//       queryStr += `
//         AND sr.department = $${queryParams.length + 1}
//       `;
//       queryParams.push(department);
//     }

//     queryStr += `
//     GROUP BY
//         categories.title;
//     `;

//     const result = await pool.query(queryStr, queryParams);

//     // Send the JSON response back to the client
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// });

router.get("/result_totalDetail", async (req, res) => {
  try {
    const { select_date, department } = req.query;

    let queryParams = [];
    let queryStr = `
    SELECT
        categories.title,
        COALESCE(SUM(CASE WHEN sr.con_wk = categories.title THEN 1 ELSE 0 END), 0) AS result
    FROM
        (
            SELECT 'Normal working' AS title
            UNION ALL
            SELECT 'OT'
            UNION ALL
            SELECT 'Holiday'
            UNION ALL
            SELECT 'Repair'
            UNION ALL
            SELECT 'Working in line'
            UNION ALL
            SELECT 'Roving'
            UNION ALL
            SELECT 'Other'
            UNION ALL
            SELECT 'Leave 2 Hr'
            UNION ALL
            SELECT 'Leave 4 Hr'
        ) AS categories
    LEFT JOIN
        smart.smart_man_working_status AS sr
        ON categories.title = sr.con_wk
    `;

    if (select_date !== "ALL") {
      queryStr += `
        AND sr.select_date = $${queryParams.length + 1}
      `;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      queryStr += `
        AND sr.department = $${queryParams.length + 1}
      `;
      queryParams.push(department);
    }

    queryStr += `
    GROUP BY
        categories.title;
    `;

    const result = await pool.query(queryStr, queryParams);

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/result_total3", async (req, res) => {
  try {
    const { select_date, department } = req.query;

    let queryParams = [];
    let queryStr = ``;

    if (select_date !== "ALL") {
      if (queryParams.length > 0) {
        queryStr += `
          AND
        `;
      } else {
        queryStr += `
          WHERE
        `;
      }
      queryStr += `
          select_date = $${queryParams.length + 1}
      `;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      if (queryParams.length > 0) {
        queryStr += `
          AND
        `;
      } else {
        queryStr += `
          WHERE
        `;
      }
      queryStr += `
          department = $${queryParams.length + 1}
      `;
      queryParams.push(department);
    }

    const result = await pool.query(
      `
  SELECT
    'Working' AS title,
    SUM(CASE WHEN con_wk IN ('Normal working','OT','Holiday') THEN 1 ELSE 0 END) AS result
  FROM smart.smart_man_working_status
  ${queryStr}
  union all
  SELECT
    'Support' AS title,
    SUM(CASE WHEN con_wk IN ('Repair','Roving','Working in line','Other') THEN 1 ELSE 0 END) AS result
  FROM smart.smart_man_working_status
  ${queryStr}
  union all
  SELECT
    'Leave' AS title,
    SUM(CASE WHEN con_wk IN ('Leave') THEN 1 ELSE 0 END) AS result
  FROM smart.smart_man_working_status
  ${queryStr}
  `,
      queryParams // ส่งพารามิเตอร์แบบตรงตามตำแหน่ง
    );

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/distinct_selectdate", async (req, res) => {
  try {
    const result = await pool.query(
      `
     select
	distinct select_date
from
	smart.smart_man_working_status srt ;
        `
    );

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// router.get("/Table_data", async (req, res) => {
//   try {
//     const { select_date, department, card_select } = req.query; // Use req.query to access query parameters
//     const result = await pool.query(
//       `
//       SELECT
//         id_code AS id,
//         "name",
//         surname,
//         cost_center,
//         ds_ns,
//         con_wk,
//         department,
//         date_time,
//         car_infor,
//         stop_car,
//         select_date,
//         wk_hr
//       FROM
//         smart.smart_man_working_status srt
//       WHERE
//         select_date = $1
//         AND department = $2
//         AND con_wk = $3
//       `,
//       [select_date, department, card_select]
//     );

//     console.log(select_date, department, card_select);
//     // Send the JSON response back to the client
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error executing query:", error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// });

router.get("/table_view_data", async (req, res) => {
  try {
    const { select_date, department, con_wk } = req.query;

    let queryStr = `
select *
from smart.smart_man_working_status srt
`;
    let queryParams = [];
    if (select_date !== "ALL") {
      queryStr += `
WHERE select_date = $${queryParams.length + 1}
`;
      queryParams.push(select_date);
    }
    if (department !== "ALL") {
      if (queryParams.length > 0) {
        queryStr += `
AND department = $${queryParams.length + 1}
`;
      } else {
        queryStr += `
WHERE department = $${queryParams.length + 1}
`;
      }
      queryParams.push(department);
    }

    if (con_wk !== "ALL") {
      if (queryParams.length > 0) {
        queryStr += `
AND con_wk in ($${queryParams.length + 1})
`;
      } else {
        queryStr += `
WHERE con_wk in ($${queryParams.length + 1})
`;
      }
      queryParams.push(department);
    }
    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/result_totalToday", async (req, res) => {
  try {
    const { select_date, department } = req.query;

    let queryParams = [];
    let queryStr = `
    SELECT
        categories.title,
        COALESCE(SUM(CASE WHEN sr.con_wk = categories.title THEN 1 ELSE 0 END), 0) AS result
    FROM
        (
            SELECT 'Normal working' AS title
            UNION ALL
            SELECT 'OT'
            UNION ALL
            SELECT 'Holiday'
        ) AS categories
    LEFT JOIN
        smart.smart_man_working_status AS sr
        ON categories.title = sr.con_wk
    `;

    if (select_date !== "ALL") {
      queryStr += `
        AND sr.select_date = $${queryParams.length + 1}
      `;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      queryStr += `
        AND sr.department = $${queryParams.length + 1}
      `;
      queryParams.push(department);
    }

    queryStr += `
    GROUP BY
        categories.title;
    `;

    const result = await pool.query(queryStr, queryParams);

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/result_totalSupport", async (req, res) => {
  try {
    const { select_date, department } = req.query;

    let queryParams = [];
    let queryStr = `
    SELECT
        categories.title,
        COALESCE(SUM(CASE WHEN sr.con_wk = categories.title THEN 1 ELSE 0 END), 0) AS result
    FROM
        (
            SELECT 'Repair' AS title
            UNION ALL
            SELECT 'Working in line'
            UNION ALL
            SELECT 'Other'
            UNION ALL
            SELECT 'Roving'
        ) AS categories
    LEFT JOIN
        smart.smart_man_working_status AS sr
        ON categories.title = sr.con_wk
    `;

    if (select_date !== "ALL") {
      queryStr += `
        AND sr.select_date = $${queryParams.length + 1}
      `;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      queryStr += `
        AND sr.department = $${queryParams.length + 1}
      `;
      queryParams.push(department);
    }

    queryStr += `
    GROUP BY
        categories.title;
    `;

    const result = await pool.query(queryStr, queryParams);

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/result_totalLeave", async (req, res) => {
  try {
    const { select_date, department } = req.query;

    let queryParams = [];
    let queryStr = `
    SELECT
        categories.title,
        COALESCE(SUM(CASE WHEN sr.con_wk = categories.title THEN 1 ELSE 0 END), 0) AS result
    FROM
        (
            SELECT 'Leave 2 Hr' AS title
            UNION ALL
            SELECT 'Leave 4 Hr'
            
        ) AS categories
    LEFT JOIN
        smart.smart_man_working_status AS sr
        ON categories.title = sr.con_wk
    `;

    if (select_date !== "ALL") {
      queryStr += `
        AND sr.select_date = $${queryParams.length + 1}
      `;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      queryStr += `
        AND sr.department = $${queryParams.length + 1}
      `;
      queryParams.push(department);
    }

    queryStr += `
    GROUP BY
        categories.title;
    `;

    const result = await pool.query(queryStr, queryParams);

    // Send the JSON response back to the client
    res.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
module.exports = router;

// WHERE con_wk IN ('OT', 'Leave','Holiday','Repair','Roving','Working in line','Other','Leave 2 Hr','Leave 4 Hr');

router.get("/Table_data", async (req, res) => {
  try {
    const { select_date, department, con_wk } = req.query; // Use req.query to access query parameters

    let queryStr = `
      SELECT 
        id_code AS id,
        "name",
        surname,
        cost_center,
        ds_ns,
        con_wk,
        department,
        date_time,
        car_infor,
        stop_car,
        select_date,
        wk_hr
      FROM
        smart.smart_man_working_status srt`;

    let queryParams = [];

    if (select_date !== "ALL") {
      queryStr += `
      WHERE select_date = $${queryParams.length + 1}`;
      queryParams.push(select_date);
    }

    if (department !== "ALL") {
      if (queryParams.length > 0) {
        queryStr += `
        AND department = $${queryParams.length + 1}`;
      } else {
        queryStr += `
        WHERE department = $${queryParams.length + 1}`;
      }
      queryParams.push(department);
    }

    if (
      con_wk !== "ALL" &&
      con_wk !== "Working" &&
      con_wk !== "Support" &&
      con_wk !== "Leave"
    ) {
      if (queryParams.length > 0) {
        queryStr += `
        AND con_wk IN ($${queryParams.length + 1})`;
      } else {
        queryStr += `
        WHERE con_wk IN ($${queryParams.length + 1})`;
      }
      queryParams.push(con_wk);
    } else if (con_wk === "Working") {
      if (queryParams.length > 0) {
        queryStr += `
        AND con_wk IN  ('Normal working','OT','Holiday')`;
      } else {
        queryStr += `
        WHERE con_wk IN ('Normal working','OT','Holiday')`;
      }
    } else if (con_wk === "Support") {
      if (queryParams.length > 0) {
        queryStr += `
        AND con_wk IN  ('Support')`;
      } else {
        queryStr += `
        WHERE con_wk IN ('Support')`;
      }
    } else if (con_wk === "Leave") {
      if (queryParams.length > 0) {
        queryStr += `
        AND con_wk IN  ('Leave')`;
      } else {
        queryStr += `
        WHERE con_wk IN ('Leave')`;
      }
    }

    console.log(queryParams);
    const result = await pool.query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
