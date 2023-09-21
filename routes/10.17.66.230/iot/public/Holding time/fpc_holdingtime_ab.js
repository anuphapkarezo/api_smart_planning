const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  host: "10.17.66.230",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "iot",
});

const query = (text, params) => pool.query(text, params);

router.get("/page1/distinctproc_status", async (req, res) => {
  try {
    const result = await query(
      `select
      distinct proc_status
    from
      public.fpc_holdingtime_ab
    order by
      proc_status desc
    `
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/distinctcondition_desc", async (req, res) => {
  try {
    const { proc_status } = req.query;
    let queryStr = `
    select
    distinct condition_desc
  from
    public.fpc_holdingtime_ab
    `;

    let queryParams = [];

    if (proc_status !== "ALL") {
      queryStr += `
        where
        proc_status = $1
      `;
      queryParams.push(proc_status);
    }

    queryStr += `
    order by 
    condition_desc desc
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/distinctprd_name", async (req, res) => {
  try {
    const { proc_status, condition_desc } = req.query;
    let queryStr = `
    select
      distinct prd_name
    from
      public.fpc_holdingtime_ab
    `;

    let queryParams = [];

    if (proc_status !== "ALL") {
      queryStr += `
      where
        proc_status = $1
      `;
      queryParams.push(proc_status);
    }

    if (condition_desc !== "ALL") {
      if (queryParams.length === 0) {
        queryStr += `
        where
          condition_desc = $1
        `;
      } else {
        queryStr += `
        and
          condition_desc = $2
        `;
      }
      queryParams.push(condition_desc);
    }

    queryStr += `
      order by 
      prd_name desc
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/table", async (req, res) => {
  try {
    const { proc_status, condition_desc, prd_name } = req.query;

    let queryStr = `
    SELECT
  id,
  lot_no,
  prd_item_code,
  prd_name,
  ro_rev,
  ro_seq,
  roll_no,
  roll_lot_count,
  con_lot_count,
  current_proc_id,
  current_process,
  proc_status,
  std_min_lot,
  a1a2_b1b2_a1b1_time,
  lock_holding_time,
  warning_holding_time,
  warning_std_time,
  lock_std_time,
  a2b1_time,
  start_proc_id,
  a,
  a1,
  a2,
  stop_proc_id,
  b,
  b1,
  b2,
  "CURRENT_TIME" as "current_time",
  CASE
    WHEN a2b1_time >= warning_holding_time AND a2b1_time < lock_holding_time THEN 'Waring'
    WHEN a2b1_time >= lock_holding_time THEN 'Over Holding'
    WHEN a2b1_time < warning_holding_time THEN 'Keep'
    ELSE ''
  END AS "result"
FROM
  public.fpc_holdingtime_ab
    `;

    let queryParams = [];

    if (proc_status !== "ALL") {
      queryStr += `
        WHERE
          proc_status = $1
      `;
      queryParams.push(proc_status);
    }

    if (condition_desc !== "ALL") {
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
          condition_desc = $${queryParams.length + 1}
      `;
      queryParams.push(condition_desc);
    }

    if (prd_name !== "ALL") {
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
          prd_name = $${queryParams.length + 1}
      `;
      queryParams.push(prd_name);
    }

    queryStr += `
      ORDER BY 
        a2b1_time DESC
    `;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/cardsummary", async (req, res) => {
  try {
    const { proc_status, condition_desc, prd_name } = req.query;

    let queryStr = `
    SELECT
  id,
  lot_no,
  prd_item_code,
  prd_name,
  ro_rev,
  ro_seq,
  roll_no,
  roll_lot_count,
  con_lot_count,
  current_proc_id,
  current_process,
  proc_status,
  std_min_lot,
  a1a2_b1b2_a1b1_time,
  lock_holding_time,
  warning_holding_time,
  warning_std_time,
  lock_std_time,
  a2b1_time,
  start_proc_id,
  a,
  a1,
  a2,
  stop_proc_id,
  b,
  b1,
  b2,
  "CURRENT_TIME" as "current_time",
  CASE
    WHEN a2b1_time >= warning_holding_time AND a2b1_time < lock_holding_time THEN 'Waring'
    WHEN a2b1_time >= lock_holding_time THEN 'Over Holding'
    WHEN a2b1_time < warning_holding_time THEN 'Keep'
    ELSE ''
  END AS "result"
FROM
  public.fpc_holdingtime_ab
    `;

    let queryParams = [];

    if (proc_status !== "ALL") {
      queryStr += `
        WHERE
          proc_status = $1
      `;
      queryParams.push(proc_status);
    }

    if (condition_desc !== "ALL") {
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
          condition_desc = $${queryParams.length + 1}
      `;
      queryParams.push(condition_desc);
    }

    if (prd_name !== "ALL") {
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
          prd_name = $${queryParams.length + 1}
      `;
      queryParams.push(prd_name);
    }

    queryStr += `
      ORDER BY 
        a2b1_time DESC
    `;

    let queryStr2 = `
    -- คำสั่ง SQL แสดงผลลัพธ์ของแต่ละค่าและผลรวม
SELECT
  result,
  COUNT(result) AS result_count
FROM (${queryStr}) AS subquery
GROUP BY result

UNION ALL

-- คำสั่ง SQL สำหรับผลรวม
SELECT
  'Total' as "result",
  COUNT(*) AS result_count
FROM
(${queryStr}) AS subquery
`;

    // console.log(queryStr2);
    const result = await query(queryStr2, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/page1/tablecardclick", async (req, res) => {
  try {
    const { proc_status, condition_desc, prd_name, status } = req.query;

    let queryStr = `
    select *
from
(SELECT
  id,
  lot_no,
  prd_item_code,
  prd_name,
  ro_rev,
  ro_seq,
  roll_no,
  roll_lot_count,
  con_lot_count,
  current_proc_id,
  current_process,
  proc_status,
  std_min_lot,
  a1a2_b1b2_a1b1_time,
  lock_holding_time,
  warning_holding_time,
  warning_std_time,
  lock_std_time,
  a2b1_time,
  start_proc_id,
  a,
  a1,
  a2,
  stop_proc_id,
  b,
  b1,
  b2,
  "CURRENT_TIME" as "current_time",
  CASE
  WHEN a2b1_time >= warning_holding_time AND a2b1_time < lock_holding_time THEN 'Waring'
  WHEN a2b1_time >= lock_holding_time THEN 'Over Holding'
  WHEN a2b1_time < warning_holding_time THEN 'Keep'
  ELSE ''
END AS statusresult
FROM
  public.fpc_holdingtime_ab
    `;

    let queryParams = [];

    if (proc_status !== "ALL") {
      queryStr += `
        WHERE
          proc_status = $1
      `;
      queryParams.push(proc_status);
    }

    if (condition_desc !== "ALL") {
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
          condition_desc = $${queryParams.length + 1}
      `;
      queryParams.push(condition_desc);
    }

    if (prd_name !== "ALL") {
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
          prd_name = $${queryParams.length + 1}
      `;
      queryParams.push(prd_name);
    }

    queryStr += `
      ORDER BY 
        a2b1_time DESC) AS subquery
    `;

    if (status !== "Total") {
      if (queryParams.length > 0) {
        queryStr += `
          WHERE
        `;
      } else {
        queryStr += `
          WHERE
        `;
      }
      queryStr += `
      statusresult = $${queryParams.length + 1}
      `;
      queryParams.push(status);
    }

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
