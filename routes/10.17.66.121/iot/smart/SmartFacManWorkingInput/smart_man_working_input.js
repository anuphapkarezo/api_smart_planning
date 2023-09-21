const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  host: "10.17.66.121",
  port: 5432,
  user: "postgres",
  password: "ez2ffp0bp5U3",
  database: "iot", // แทนที่ด้วยชื่อฐานข้อมูลของคุณ
});

// const pool = new Pool({
//   host: "127.0.0.1",
//   port: 5432,
//   user: "postgres",
//   password: "fujikura",
//   database: "postgres", // แทนที่ด้วยชื่อฐานข้อมูลของคุณ
// });

const query = (text, params) => pool.query(text, params);

router.get("/check_insert_or_update", async (req, res) => {
  try {
    const { id_no, shif, select_date } = req.query;
    const result = await query(
      `SELECT *
       FROM smart.smart_man_working_input
       WHERE id_no = $1
       AND shif = $2
       AND select_date = $3`,
      [id_no, shif, select_date]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/insertdata", async (req, res) => {
  try {
    const {
      id_no,
      con_wk,
      date_time,
      shif,
      department,
      cc,
      process,
      select_date,
    } = req.body;

    const result = await query(
      `insert
	into
	smart.smart_man_working_input
(id_no,
	con_wk,
	date_time,
	shif,
	department,
	cc,
	process,
	select_date
	)
values($1,
$2,
$3,
$4,
$5,
$6,
$7,
$8
)`,
      [id_no, con_wk, date_time, shif, department, cc, process, select_date]
    );

    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

// UPDATE route to UPDATE data
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_no,
      con_wk,
      date_time,
      shif,
      department,
      cc,
      process,
      select_date,
    } = req.body;

    const result = await query(
      `update
      smart.smart_man_working_input
    set
      id_no = $1,
      con_wk = $2,
      date_time = $3,
      shif = $4,
      department = $5,
      cc = $6,
      process = $7,
      select_date = $8
      where
        id = $9`, // Include $16 as a placeholder for id
      [
        id_no,
        con_wk,
        date_time,
        shif,
        department,
        cc,
        process,
        select_date,
        id, // Bind id as the 16th parameter
      ]
    );

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

router.get("/tableMaxDatetime", async (req, res) => {
  try {
    const { process } = req.query;
    const result = await query(
      `SELECT
        id_no,
        con_wk,
        date_time,
        shif,
        department,
        cc,
        process,
        select_date,
        id
      FROM
        smart.smart_man_working_input
      WHERE
        date_time::date >= (
          SELECT MAX(date_time::date)
          FROM smart.smart_man_working_input
        )
      AND process = $1
      ORDER BY
        date_time::timestamp ASC`,
      [process]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
