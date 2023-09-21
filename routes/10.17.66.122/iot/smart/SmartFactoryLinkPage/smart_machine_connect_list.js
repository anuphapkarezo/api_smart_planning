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

router.get("/count-status", async (req, res) => {
  try {
    const result = await query(`
    select
	status,
	count,
	case
		when status = 'Finished' then
(
		select
			json_agg(json_build_object(
'plan_date_formatted',
			plan_date_formatted,
			'finished_count',
			finished_count
))
		from
			(
			select
				TO_CHAR(plan_date,
				'Mon-YYYY') as plan_date_formatted,
				COUNT(*) as finished_count
			from
				smart.smart_machine_connect_list
			where
				status = 'Finished'
			group by
				TO_CHAR(plan_date,
				'Mon-YYYY')
			order by
				TO_DATE(TO_CHAR(plan_date,
				'Mon-YYYY'),
				'Mon-YYYY') asc
) subquery
)
		when status = 'Planed' then
(
		select
			json_agg(json_build_object(
'plan_date_formatted',
			plan_date_formatted,
			'planed_count',
			planed_count
))
		from
			(
			select
				TO_CHAR(plan_date,
				'Mon-YYYY') as plan_date_formatted,
				COUNT(*) as planed_count
			from
				smart.smart_machine_connect_list
			where
				status = 'Planed'
			group by
				TO_CHAR(plan_date,
				'Mon-YYYY')
			order by
				TO_DATE(TO_CHAR(plan_date,
				'Mon-YYYY'),
				'Mon-YYYY') asc
) subquery
)
		when status = 'Wait for plan' then
(
		select
			json_agg(json_build_object(
'plan_date_formatted',
			plan_date_formatted,
			'wait_for_plan_count',
			wait_for_plan_count
))
		from
			(
			select
				TO_CHAR(plan_date,
				'Mon-YYYY') as plan_date_formatted,
				COUNT(*) as wait_for_plan_count
			from
				smart.smart_machine_connect_list
			where
				status = 'Wait for plan'
			group by
				TO_CHAR(plan_date,
				'Mon-YYYY')
			order by
				TO_DATE(TO_CHAR(plan_date,
				'Mon-YYYY'),
				'Mon-YYYY') asc
) subquery
)
		when status = '' then
(
		select
			json_agg(json_build_object(
'plan_date_formatted',
			plan_date_formatted,
			'empty_status_count',
			empty_status_count
))
		from
			(
			select
				TO_CHAR(plan_date,
				'Mon-YYYY') as plan_date_formatted,
				COUNT(*) as empty_status_count
			from
				smart.smart_machine_connect_list
			where
				status = ''
			group by
				TO_CHAR(plan_date,
				'Mon-YYYY')
			order by
				TO_DATE(TO_CHAR(plan_date,
				'Mon-YYYY'),
				'Mon-YYYY') asc
) subquery
)
		else null
	end as sum_month
from
	(
	select
		status,
		COUNT(*) as count
	from
		smart.smart_machine_connect_list
	where
		status in ('Finished', 'Planed', 'Wait for plan', '')
	group by
		status
union all
	select
		'total' as status,
		COUNT(*) as count
	from
		smart.smart_machine_connect_list
	where
		status in ('Finished', 'Planed', 'Wait for plan', '')
) subquery
order by
	count desc
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/tablescada", async (req, res) => {
  try {
    const { status, item_sub_process, item_iot_group1, item_building } =
      req.query;
    let queryStr;
    const queryParams = [];

    queryStr = `SELECT * FROM smart.smart_machine_connect_list`;
    if (status === "total") {
      queryStr += ` WHERE status IN ('Finished', 'Planned', 'Wait for plan', '')`;
    } else {
      queryStr += ` WHERE status = $1`;
      queryParams.push(status);
    }

    if (item_sub_process !== "ALL") {
      queryStr += ` AND item_sub_process = $${queryParams.length + 1}`;
      queryParams.push(item_sub_process);
    }

    if (item_iot_group1 !== "ALL") {
      queryStr += ` AND item_iot_group1 = $${queryParams.length + 1}`;
      queryParams.push(item_iot_group1);
    }

    if (item_building !== "ALL") {
      queryStr += ` AND item_building = $${queryParams.length + 1}`;
      queryParams.push(item_building);
    }

    queryStr += ` ORDER BY finish_date ASC`;

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/barchartCountbyitem_sub_process", async (req, res) => {
  try {
    const { item_sub_process, item_iot_group1, status, item_building } =
      req.query;

    let queryStr;
    const queryParams = [];

    if (item_iot_group1 === "ALL") {
      queryStr = `
      SELECT
      item_sub_process,
      COUNT(item_sub_process) as result_count_status
    FROM
      smart.smart_machine_connect_list
      `;
    } else {
      queryStr = `
      SELECT
        item_sub_process,
        COUNT(item_sub_process) as result_count_status
      FROM
        smart.smart_machine_connect_list
      `;
    }

    if (status === "total") {
      queryStr += `
        WHERE
          status IN ('Finished', 'Planned', 'Wait for plan', '')
      `;
    } else {
      queryStr += `
        WHERE
          status = $1
      `;
      queryParams.push(status);
    }

    // Check if item_iot_group1 is not "ALL"
    if (item_iot_group1 !== "ALL") {
      queryStr += ` AND item_iot_group1 = $${queryParams.length + 1}`;
      queryParams.push(item_iot_group1);
    }
    // Check if item_iot_group1 is not "ALL"
    if (item_sub_process !== "ALL") {
      queryStr += ` AND item_sub_process = $${queryParams.length + 1}`;
      queryParams.push(item_sub_process);
    }

    // Check if item_building is not "ALL"
    if (item_building !== "ALL") {
      queryStr += ` AND item_building = $${queryParams.length + 1}`;
      queryParams.push(item_building);
    }

    if (item_iot_group1 === "ALL") {
      queryStr += `
      GROUP BY
      item_sub_process
    ORDER BY
      item_sub_process
    `;
    } else {
      queryStr += `
      GROUP BY
        item_sub_process
      ORDER BY
        item_sub_process
    `;
    }

    const result = await query(queryStr, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/distinctitem_building", async (req, res) => {
  try {
    const { item_iot_group1, item_sub_process, status } = req.query;

    let queryStr;
    const queryParams = [];

    queryStr = `SELECT DISTINCT item_building FROM smart.smart_machine_connect_list`;
    if (status === "total") {
      queryStr += ` WHERE status IN ('Finished', 'Planned', 'Wait for plan', '')`;
    } else {
      queryStr += ` WHERE status = $1`;
      queryParams.push(status);
    }

    // Check if item_iot_group1 is not "ALL"
    if (item_iot_group1 !== "ALL") {
      queryStr += ` AND item_iot_group1 = $${queryParams.length + 1}`;
      queryParams.push(item_iot_group1);
    }
    if (item_sub_process !== "ALL") {
      queryStr += ` AND item_sub_process = $${queryParams.length + 1}`;
      queryParams.push(item_sub_process);
    }

    queryStr += ` ORDER BY item_building ASC`;
    console.log(queryStr);
    const result = await query(queryStr, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/distinctitem_sub_process", async (req, res) => {
  try {
    const { item_iot_group1, item_building, status } = req.query;

    let queryStr;
    const queryParams = [];

    if (status === "total") {
      queryStr = `
        SELECT DISTINCT item_sub_process
        FROM smart.smart_machine_connect_list
        WHERE status IN ('Finished', 'Planned', 'Wait for plan', '')
      `;
    } else {
      queryStr = `
        SELECT DISTINCT item_sub_process
        FROM smart.smart_machine_connect_list
        WHERE status = $1
      `;
      queryParams.push(status);
    }

    // Check if item_iot_group1 is not "ALL"
    if (item_iot_group1 !== "ALL") {
      queryStr += ` AND item_iot_group1 = $${queryParams.length + 1}`;
      queryParams.push(item_iot_group1);
    }
    // Check if item_iot_group1 is not "ALL"
    if (item_building !== "ALL") {
      queryStr += ` AND item_building = $${queryParams.length + 1}`;
      queryParams.push(item_building);
    }
    const result = await query(queryStr, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/distinctitem_iot_group1", async (req, res) => {
  try {
    const { item_sub_process, item_building, status } = req.query;

    let queryStr = `
      SELECT DISTINCT item_iot_group1
      FROM smart.smart_machine_connect_list
      WHERE 1=1
    `;

    const queryParams = [];

    if (item_sub_process !== "ALL") {
      queryStr += ` AND item_sub_process = $${queryParams.length + 1}`;
      queryParams.push(item_sub_process);
    }

    if (item_building !== "ALL") {
      queryStr += ` AND item_building = $${queryParams.length + 1}`;
      queryParams.push(item_building);
    }

    if (status === "total") {
      queryStr += `
        AND status IN ('Finished', 'Planned', 'Wait for plan', '')
      `;
    } else {
      queryStr += ` AND status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    const result = await query(queryStr, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.put("/scada/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_factory,
      item_code,
      item_desc1,
      item_desc2,
      item_desc3,
      item_status,
      item_building,
      item_group,
      item_sub_group,
      item_owner_cc,
      item_sub_process,
      item_mac_maker,
      item_iot_mc_type,
      item_iot_group1,
      item_iot_cont1,
      item_iot_group2,
      item_iot_cont2,
      status,
      npi_year,
      plan_date,
      finish_date,
      remark,
      feeder_no,
      barcodeid,
      barcodeid_plan_date,
      barcodeid_finish_date,
      status_barcodeid,
      stopper,
      stopper_plan_date,
      stopper_finish_date,
      stopper_status,
    } = req.body;

    const result = await query(
      `UPDATE smart.smart_machine_connect_list
       SET
         item_factory = $1,
         item_code = $2,
         item_desc1 = $3,
         item_desc2 = $4,
         item_desc3 = $5,
         item_status = $6,
         item_building = $7,
         item_group = $8,
         item_sub_group = $9,
         item_owner_cc = $10,
         item_sub_process = $11,
         item_mac_maker = $12,
         item_iot_mc_type = $13,
         item_iot_group1 = $14,
         item_iot_cont1 = $15,
         item_iot_group2 = $16,
         item_iot_cont2 = $17,
         status = $18,
         npi_year = $19,
         plan_date = $20,
         finish_date = $21,
         remark = $22,
         feeder_no = $23,
         barcodeid  = $24,
        barcodeid_plan_date  = $25,
        barcodeid_finish_date  = $26,
        status_barcodeid  = $27,
        stopper  = $28,
        stopper_plan_date  = $29,
        stopper_finish_date  = $30,
        stopper_status  = $31
       WHERE id = $32;`,
      [
        item_factory,
        item_code,
        item_desc1,
        item_desc2,
        item_desc3,
        item_status,
        item_building,
        item_group,
        item_sub_group,
        item_owner_cc,
        item_sub_process,
        item_mac_maker,
        item_iot_mc_type,
        item_iot_group1,
        item_iot_cont1,
        item_iot_group2,
        item_iot_cont2,
        status,
        npi_year,
        plan_date,
        finish_date,
        remark,
        feeder_no,
        barcodeid,
        barcodeid_plan_date,
        barcodeid_finish_date,
        status_barcodeid,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status,
        id,
      ]
    );

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

// DELETE route to delete data
router.delete("/scada/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM smart.smart_machine_connect_list WHERE id = $1;",
      [id]
    );

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting data" });
  }
});

// POST route to add new data
router.post("/scada/", async (req, res) => {
  try {
    const {
      item_factory,
      item_code,
      item_desc2,
      item_desc3,
      item_status,
      item_building,
      item_group,
      item_sub_group,
      item_owner_cc,
      item_sub_process,
      item_mac_maker,
      item_iot_mc_type,
      item_iot_group1,
      item_iot_cont1,
      item_iot_group2,
      item_iot_cont2,
      status,
      npi_year,
      plan_date,
      finish_date,
      remark,
      feeder_no,
      item_desc1,
      barcodeid,
      barcodeid_plan_date,
      barcodeid_finish_date,
      status_barcodeid,
      stopper,
      stopper_plan_date,
      stopper_finish_date,
      stopper_status,
    } = req.body;

    const result = await query(
      `insert
      into
      smart_machine_connect_list
    (item_factory,
      item_code,
      item_desc2,
      item_desc3,
      item_status,
      item_building,
      item_group,
      item_sub_group,
      item_owner_cc,
      item_sub_process,
      item_mac_maker,
      item_iot_mc_type,
      item_iot_group1,
      item_iot_cont1,
      item_iot_group2,
      item_iot_cont2,
      status,
      npi_year,
      plan_date,
      finish_date,
      remark,
      feeder_no,
      item_desc1,
      barcodeid,
	barcodeid_plan_date,
	barcodeid_finish_date,
	status_barcodeid,
	stopper,
	stopper_plan_date,
	stopper_finish_date,
	stopper_status)
    values($1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13,
    $14,
    $15,
    $16,
    $17,
    $18,
    $19,
    $20,
    $21,
    $22,
    $23,
    $24,
    $25,
    $26,
    $27,
    $28,
    $29,
    $30,
    $31);`,
      [
        item_factory,
        item_code,
        item_desc2,
        item_desc3,
        item_status,
        item_building,
        item_group,
        item_sub_group,
        item_owner_cc,
        item_sub_process,
        item_mac_maker,
        item_iot_mc_type,
        item_iot_group1,
        item_iot_cont1,
        item_iot_group2,
        item_iot_cont2,
        status,
        npi_year,
        plan_date,
        finish_date,
        remark,
        feeder_no,
        item_desc1,
        barcodeid,
        barcodeid_plan_date,
        barcodeid_finish_date,
        status_barcodeid,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status,
      ]
    );

    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

router.get("/tablebarcodeid", async (req, res) => {
  try {
    const { status } = req.query;

    let queryStr = "";
    let queryParams = [];

    if (status === "total") {
      queryStr = `
      select
  id,
      item_code, 
      item_building,
      item_owner_cc,
      item_sub_process,
      item_iot_group1,
      barcodeid ,
      barcodeid_plan_date ,
      barcodeid_finish_date ,
      status_barcodeid
    from
      smart.smart_machine_connect_list
     WHERE status_barcodeid IN ('Finished', 'Planed', 'Wait for plan', '')  OR status_barcodeid IS NULL
     and  barcodeid = 'Y'
      `;
    } else {
      if (status === "") {
        queryStr = `
        select
    id,
    item_code, 
    item_building,
    item_owner_cc,
    item_sub_process,
    item_iot_group1,
    barcodeid ,
    barcodeid_plan_date ,
    barcodeid_finish_date ,
    status_barcodeid
  from
    smart.smart_machine_connect_list
   WHERE status_barcodeid = $1 OR status_barcodeid IS NULL
   and  barcodeid = 'Y'
        `;
        queryParams = [status];
      } else {
        queryStr = `
        select
    id,
    item_code, 
    item_building,
    item_owner_cc,
    item_sub_process,
    item_iot_group1,
    barcodeid ,
    barcodeid_plan_date ,
    barcodeid_finish_date ,
    status_barcodeid
  from
    smart.smart_machine_connect_list
   WHERE status_barcodeid = $1
   and  barcodeid = 'Y'
        `;
        queryParams = [status];
      }
    }

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// PUT route to update data
router.put("/barcodeid/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_code,
      item_building,
      item_owner_cc,
      item_sub_process,
      item_iot_group1,
      barcodeid,
      barcodeid_plan_date,
      barcodeid_finish_date,
      status_barcodeid,
    } = req.body;

    // Rest of the code remains unchanged
    const result = await query(
      `UPDATE smart.smart_machine_connect_list
       SET
         item_code = $1,
         item_building = $2,
         item_owner_cc = $3,
         item_sub_process = $4,
         item_iot_group1 = $5,
         barcodeid = $6,
         barcodeid_plan_date = $7,
         barcodeid_finish_date = $8,
         status_barcodeid = $9
       WHERE id = $10;`,
      [
        item_code,
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        barcodeid,
        barcodeid_plan_date,
        barcodeid_finish_date,
        status_barcodeid,
        id,
      ]
    );

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

// DELETE route to delete data
router.delete("/barcodeid/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Rest of the code remains unchanged
    const result = await query(
      "DELETE FROM smart.smart_machine_connect_list WHERE id = $1;",
      [id]
    );

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting data" });
  }
});

// POST route to add new data
router.post("/barcodeid/", async (req, res) => {
  try {
    const {
      item_code,
      item_building,
      item_owner_cc,
      item_sub_process,
      item_iot_group1,
      barcodeid,
      barcodeid_plan_date,
      barcodeid_finish_date,
      status_barcodeid,
    } = req.body;

    // Rest of the code remains unchanged
    const result = await query(
      `INSERT INTO smart_machine_connect_list
      (item_code,
       item_building,
       item_owner_cc,
       item_sub_process,
       item_iot_group1,
       barcodeid,
       barcodeid_plan_date,
       barcodeid_finish_date,
       status_barcodeid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        item_code,
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        barcodeid,
        barcodeid_plan_date,
        barcodeid_finish_date,
        status_barcodeid,
      ]
    );

    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

router.get("/tablestopper", async (req, res) => {
  try {
    const { status } = req.query;

    let queryStr = "";
    let queryParams = [];

    if (status === "total") {
      queryStr = `
      select
	id,
	item_code,
	item_building,
	item_owner_cc,
	item_sub_process,
	item_iot_group1,
	stopper,
	stopper_plan_date,
	stopper_finish_date,
	stopper_status
from
	smart.smart_machine_connect_list
where
	stopper_status in ('Finished', 'Planed', 'Wait for plan', '')
	or stopper_status is null
	and stopper = 'Y'
      `;
    } else {
      if (status === "") {
        queryStr = `
        select
        id,
        item_code, 
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status
      from
        smart.smart_machine_connect_list
      where
        stopper_status = $1
        OR stopper_status is null    
        and stopper = 'Y'  
      `;
        queryParams = [status];
      } else {
        queryStr = `
        select
        id,
        item_code, 
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status
      from
        smart.smart_machine_connect_list
      where
        stopper_status = $1
        and stopper = 'Y'
      `;
        queryParams = [status];
      }
    }

    const result = await query(queryStr, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// PUT route to update data
router.put("/stopper/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_code,
      item_building,
      item_owner_cc,
      item_sub_process,
      item_iot_group1,
      stopper,
      stopper_plan_date,
      stopper_finish_date,
      stopper_status,
    } = req.body;

    // Rest of the code remains unchanged
    const result = await query(
      `UPDATE smart.smart_machine_connect_list
       SET
         item_code = $1,
         item_building = $2,
         item_owner_cc = $3,
         item_sub_process = $4,
         item_iot_group1 = $5,
         stopper = $6,
         stopper_plan_date = $7,
         stopper_finish_date = $8,
         stopper_status = $9
       WHERE id = $10;`,
      [
        item_code,
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status,
        id,
      ]
    );

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating data" });
  }
});

// DELETE route to delete data
router.delete("/stopper/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Rest of the code remains unchanged
    const result = await query(
      "DELETE FROM smart.smart_machine_connect_list WHERE id = $1;",
      [id]
    );

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting data" });
  }
});

// POST route to add new data
router.post("/stopper/", async (req, res) => {
  try {
    const {
      item_code,
      item_building,
      item_owner_cc,
      item_sub_process,
      item_iot_group1,
      stopper,
      stopper_plan_date,
      stopper_finish_date,
      stopper_status,
    } = req.body;

    // Rest of the code remains unchanged
    const result = await query(
      `INSERT INTO smart_machine_connect_list
      (item_code,
       item_building,
       item_owner_cc,
       item_sub_process,
       item_iot_group1,
       stopper,
       stopper_plan_date,
       stopper_finish_date,
       stopper_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        item_code,
        item_building,
        item_owner_cc,
        item_sub_process,
        item_iot_group1,
        stopper,
        stopper_plan_date,
        stopper_finish_date,
        stopper_status,
      ]
    );

    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding data" });
  }
});

module.exports = router;
