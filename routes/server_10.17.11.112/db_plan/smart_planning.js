const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
    host: "10.17.66.112",
    port: 5432,
    user: "postgres",
    password: "systemfetl",
    database: "postgres_smartfactory",
});

const query = (text, params) => pool.query(text, params);

router.get("/productlist", async(req, res) => {
    try {
        const result = await query(
            `select DISTINCT DB.prd_name
            from 
            (select DISTINCT pf.prd_name 
            from pln.pln_fc pf 
            union
            select distinct ppwf.prd_name 
            from pln.pln_po_wip_fg ppwf 
            union
            select distinct pass.prd_name 
            from pln.pln_actual_ship_summary pass 
            union
            select distinct pfd.prd_name 
            from pln.pln_fg_detail pfd
            union
            select distinct pfu.prd_name 
            from pln.pln_fg_unmovement pfu 
            union
            select distinct ppd.prd_name 
            from pln.pln_pobal_detail ppd 
            union
            select distinct pwd.prd_name 
            from pln.pln_wip_detail pwd 
            union
            select distinct pwp.prd_name 
            from pln.pln_wip_pending pwp 
            union
            select distinct pwpd.prd_name 
            from pln.pln_wip_pending_details pwpd 
            union
            SELECT distinct 
            case when substring(DB1.prd_name , 4 , 1) = 'Z' then left(DB1.prd_name , 10)
            else left(DB1.prd_name , 8) end as prd_name
            FROM (
                select DISTINCT pf.prd_name 
                from pln.pln_fc pf 
                union
                select distinct ppwf.prd_name 
                from pln.pln_po_wip_fg ppwf 
                union
                select distinct pass.prd_name 
                from pln.pln_actual_ship_summary pass 
                union
                select distinct pfd.prd_name 
                from pln.pln_fg_detail pfd
                union
                select distinct pfu.prd_name 
                from pln.pln_fg_unmovement pfu 
                union
                select distinct ppd.prd_name 
                from pln.pln_pobal_detail ppd 
                union
                select distinct pwd.prd_name 
                from pln.pln_wip_detail pwd 
                union
                select distinct pwp.prd_name 
                from pln.pln_wip_pending pwp 
                union
                select distinct pwpd.prd_name 
                from pln.pln_wip_pending_details pwpd 
            ) DB1 ) DB
            order by DB.prd_name`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Plannig Forecast Vs PO
//SeriesList for Autocomplete
router.get("/serieslist", async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            `select distinct pln_fc.prd_series 
          from pln.pln_fc
          order by pln_fc.prd_series`
        );
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Plannig Forecast Vs PO
//get-week for head table and foreach ddata
router.get("/get-week", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        // const prd_name = req.query.prd_name;

        const result = await client.query(
            `SELECT DISTINCT 
          pf.wk,
          TO_CHAR(TO_DATE('20' || SUBSTR(pf.wk, 3, 2) || TO_CHAR(CAST(SUBSTR(pf.wk, 5) AS INTEGER), 
          'FM00'),'YYYYWW')+ INTERVAL '1 DAY', 'DD-Mon-YY') AS mon_date
          FROM pln.pln_fc pf
          WHERE SUBSTR(pf.wk, 3, 4) >= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE - INTERVAL '84 DAYS', 'YYYYWW'), 3, 4) AS result_year_week)
          AND SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '70 DAYS', 'YYYYWW'), 3, 4))
          ORDER BY pf.wk`
        );
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Plannig Forecast Vs PO
//Filter_Forecast_by_Product-Series
router.get("/filter-fc-by-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pf.pfd_period_no , pf.wk , sum(qty_fc) AS qty_fc
              from pln.pln_fc pf
              where pf.prd_name like $1 || '%'
              and pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),1,6))
              and pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),1,6))
              group by pf.pfd_period_no , pf.wk
              order by pf.pfd_period_no , pf.wk `, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `SELECT
              pf.pfd_period_no,
              pf.wk,
              pf.prd_series,
              SUM(qty_fc) AS qty_fc
              FROM pln.pln_fc pf
              where pf.prd_series = $1
              and pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),1,6))
              and pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),1,6))
              GROUP BY pf.pfd_period_no, pf.wk, pf.prd_series
              order by pf.pfd_period_no , pf.wk , pf.prd_series `, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Plannig Forecast Vs PO
//Filter_PO_all_by_Product-Series
router.get("/filter-po-all-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select ppwf.wk , 
              sum(ppwf.qty_rec) as qty_rec , 
              sum(ppwf.qty_due) as qty_due , 
              sum(ppwf.qty_fg) as qty_fg , 
              sum(ppwf.qty_wip) as qty_wip
              from  pln.pln_po_wip_fg ppwf 
              where ppwf.prd_name like $1 || '%'
              and substring(ppwf.wk,3,4)  >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),3,4))
              and substring(ppwf.wk,3,4)  <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),3,4))
              group by ppwf.wk
              order by ppwf.wk`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `SELECT
              ppwf.wk,
              ppwf.pd_series,
              SUM(qty_rec) AS qty_rec,
              SUM(qty_due) AS qty_due,
              SUM(qty_fg) AS qty_fg ,
              SUM(qty_wip) AS qty_wip
              FROM pln.pln_po_wip_fg ppwf
              where ppwf.pd_series = $1
              and substring(ppwf.wk,3,4)  >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),3,4))
              and substring(ppwf.wk,3,4)  <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),3,4))
              GROUP BY ppwf.wk, ppwf.pd_series
              order by ppwf.wk , ppwf.pd_series`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Plannig Forecast Vs PO
//Filter_PO_bal_only
router.get("/filter-po-bal-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `SELECT 'WK' || right(TO_CHAR(CURRENT_DATE, 'YYYY'), 2) || TO_CHAR(CURRENT_DATE, 'WW') AS WK, 
              SUM(ppwf.qty_bal) AS qty_bal
              FROM pln.pln_po_wip_fg ppwf 
              WHERE ppwf.prd_name LIKE $1 || '%'
              AND LEFT(ppwf.wk, 2) >= (SELECT LEFT(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 2))
              GROUP BY 'WK' || LEFT(TO_CHAR(CURRENT_DATE, 'YYYY'), 2) || TO_CHAR(CURRENT_DATE, 'WW')`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `SELECT 'WK' || right(TO_CHAR(CURRENT_DATE, 'YYYY'), 2) || TO_CHAR(CURRENT_DATE, 'WW') AS WK, 
              SUM(ppwf.qty_bal) AS qty_bal
              FROM pln.pln_po_wip_fg ppwf 
              WHERE ppwf.pd_series LIKE $1 || '%'
              AND LEFT(ppwf.wk, 2) >= (SELECT LEFT(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 2))
              GROUP BY 'WK' || LEFT(TO_CHAR(CURRENT_DATE, 'YYYY'), 2) || TO_CHAR(CURRENT_DATE, 'WW')`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_actual_ship_summary
router.get("/filter-actual-ship-summary-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pass.wk , sum(qty_ship) AS qty_ship
              from pln.pln_actual_ship_summary pass 
              where pass.prd_name like $1 || '%'
              and substring(pass.wk,3,4)  >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),3,4))
              and substring(pass.wk,3,4)  <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),3,4))
              group by pass.wk
              order by pass.wk`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pass.wk , sum(qty_ship) AS qty_ship
              from pln.pln_actual_ship_summary pass 
              where pass.prd_series like $1 || '%'
              and substring(pass.wk,3,4)  >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),3,4))
              and substring(pass.wk,3,4)  <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),3,4))
              group by pass.wk
              order by pass.wk`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_product_for_show
router.get("/filter-show-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select DISTINCT DB.prd_name
              from 
              (select DISTINCT pf.prd_name 
              from pln.pln_fc pf 
              union
              select distinct ppwf.prd_name 
              from pln.pln_po_wip_fg ppwf 
              union
              select distinct pass.prd_name 
              from pln.pln_actual_ship_summary pass 
              union
              select distinct pfd.prd_name 
              from pln.pln_fg_detail pfd
              union
              select distinct pfu.prd_name 
              from pln.pln_fg_unmovement pfu 
              union
              select distinct ppd.prd_name 
              from pln.pln_pobal_detail ppd 
              union
              select distinct pwd.prd_name 
              from pln.pln_wip_detail pwd 
              union
              select distinct pwp.prd_name 
              from pln.pln_wip_pending pwp 
              union
              select distinct pwpd.prd_name 
              from pln.pln_wip_pending_details pwpd 
              union
              SELECT distinct 
              case when substring(DB1.prd_name , 4 , 1) = 'Z' then left(DB1.prd_name , 10)
              else left(DB1.prd_name , 8) end as prd_name
              FROM (
                  select DISTINCT pf.prd_name 
                  from pln.pln_fc pf 
                  union
                  select distinct ppwf.prd_name 
                  from pln.pln_po_wip_fg ppwf 
                  union
                  select distinct pass.prd_name 
                  from pln.pln_actual_ship_summary pass 
                  union
                  select distinct pfd.prd_name 
                  from pln.pln_fg_detail pfd
                  union
                  select distinct pfu.prd_name 
                  from pln.pln_fg_unmovement pfu 
                  union
                  select distinct ppd.prd_name 
                  from pln.pln_pobal_detail ppd 
                  union
                  select distinct pwd.prd_name 
                  from pln.pln_wip_detail pwd 
                  union
                  select distinct pwp.prd_name 
                  from pln.pln_wip_pending pwp 
                  union
                  select distinct pwpd.prd_name 
                  from pln.pln_wip_pending_details pwpd 
              ) DB1 ) DB
              where DB.prd_name like $1 || '%'
              and LENGTH(DB.prd_name) > 10
              order by DB.prd_name`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            //     const result = await client.query(
            //         `select distinct ppwf.prd_name 
            //         from  pln_po_wip_fg ppwf 
            //         where ppwf.prd_name like $1 || '%'
            //         and substring(ppwf.wk,3,4)  >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'),3,4))
            //         and substring(ppwf.wk,3,4)  <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'),3,4))`, [prd_series]
            //     );
            //     client.release();
            //     res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_product_for_show
router.get("/filter-fc-diff-prev-curr", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select DB_ALL.pfd_period_no,
              DB_ALL.wk,
              DB_ALL.prd_name,
              case when (select max(pf.pfd_period_no) from pln.pln_fc pf 
                          where pf.pfd_period_no = (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6))) is null --check current period no data
                          and DB_ALL.pfd_period_no = (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6)) -- check current period 
                          then '0' else DB_ALL.qty_fc end as qty_fc
              from 
              (
              select	'20' || substring(DB_QUE.wk, 3, 4) as pfd_period_no,
                      DB_QUE.wk,
                      DB_QUE.prd_name,
                      sum(DB_QUE.qty_fc) as qty_fc
              from (SELECT
                      pf.pfd_period_no,
                      pf.wk,
                      pf.prd_name,
                      pf.qty_fc,
                      NULL as update_datetime,
                      NULL as id
              from pln.pln_fc pf
              where pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'), 1, 6))
              AND pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 1, 6))
              AND pf.pfd_period_no = '20' || substring(pf.wk, 3, 4)
              AND pf.prd_name like $1 || '%'
              and SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '0 DAYS', 'YYYYWW'), 3, 4))
              UNION
              select	TO_CHAR(TO_DATE('20' || substring(pf.wk, 3, 4), 'YYYYWW') - INTERVAL '7 days', 'YYYYWW'),
                      pf.wk,
                      pf.prd_name,
                      -pf.qty_fc,
                      pf.update_datetime,
                      pf.id
              from pln.pln_fc pf
              where pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'), 1, 6))
              AND pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 1, 6))
              AND pf.pfd_period_no = TO_CHAR(TO_DATE('20' || substring(pf.wk, 3, 4), 'YYYYWW') - INTERVAL '7 days', 'YYYYWW')
              AND pf.prd_name like $1 || '%'
              and SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '0 DAYS', 'YYYYWW'), 3, 4))
              ) DB_QUE
              GROUP by DB_QUE.wk, DB_QUE.prd_name
              union
              select 	DB_QUE.pfd_period_no,
                      DB_QUE.wk,
                      DB_QUE.prd_name,
                      sum(DB_QUE.qty_fc) as qty_fc
              from 
              (select	(SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6)) as pfd_period_no,
                      pf.wk,
                      pf.prd_name,
                      -pf.qty_fc as qty_fc
              from pln.pln_fc pf
              where pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYYWW'), 1, 6))
              and pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYYWW'), 1, 6))
              AND pf.prd_name like $1 || '%'
              and SUBSTR(pf.wk, 3, 4) >= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '7 DAYS', 'YYYYWW'), 3, 4))
              and SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '70 DAYS', 'YYYYWW'), 3, 4))
              union
              select	pf.pfd_period_no,
                      pf.wk,
                      pf.prd_name,
                      pf.qty_fc as qty_fc
              from pln.pln_fc pf
              where pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6))
              AND pf.prd_name like $1 || '%'
              and SUBSTR(pf.wk, 3, 4) >= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '7 DAYS', 'YYYYWW'), 3, 4))
              and SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '70 DAYS', 'YYYYWW'), 3, 4))) DB_QUE
              group by DB_QUE.pfd_period_no,
                      DB_QUE.wk,
                      DB_QUE.prd_name
              ) DB_ALL
              order by DB_ALL.pfd_period_no
                          ,DB_ALL.wk`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            const prd_name = req.query.prd_name;
            const result = await client.query(
                `select 	DB_ALL.pfd_period_no,
              DB_ALL.wk,
              case when (select max(pf.pfd_period_no) from pln.pln_fc pf 
                  where pf.pfd_period_no = (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6))) is null --check current period no data
                  and DB_ALL.pfd_period_no = (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6)) -- check current period 
                  then '0' else DB_ALL.qty_fc end as qty_fc
              from 
              (
              --prev=>curr
              SELECT
                  '20' || substring(DB_QUE.wk, 3, 4) as pfd_period_no,
                  DB_QUE.wk,
                  sum(DB_QUE.qty_fc) as qty_fc
              FROM
              (
                  SELECT
                      pf.pfd_period_no,
                      pf.wk,
                      SUM(pf.qty_fc) as qty_fc,
                      NULL as update_datetime,
                      NULL as id
                  FROM pln.pln_fc pf
                  WHERE pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'), 1, 6))
                  AND pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 1, 6))
                  AND pf.pfd_period_no = '20' || substring(pf.wk, 3, 4)
                  AND pf.prd_series like $1 || '%'
                  AND SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '0 DAYS', 'YYYYWW'), 3, 4))
                  GROUP BY pf.pfd_period_no, pf.wk
                  UNION
                  SELECT
                      TO_CHAR(TO_DATE('20' || substring(pf.wk, 3, 4), 'YYYYWW') - INTERVAL '7 days', 'YYYYWW'),
                      pf.wk,
                      SUM(-pf.qty_fc) as qty_fc,
                      NULL as update_datetime,
                      NULL as id
                  FROM pln.pln_fc pf
                  WHERE pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE + INTERVAL '70 days', 'YYYYWW'), 1, 6))
                  AND pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '84 days', 'YYYYWW'), 1, 6))
                  AND pf.pfd_period_no = TO_CHAR(TO_DATE('20' || substring(pf.wk, 3, 4), 'YYYYWW') - INTERVAL '7 days', 'YYYYWW')
                  AND pf.prd_series like $1 || '%'
                  AND SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '0 DAYS', 'YYYYWW'), 3, 4))
                  GROUP BY pf.pfd_period_no, pf.wk
              ) DB_QUE
              GROUP BY '20' || substring(DB_QUE.wk, 3, 4), DB_QUE.wk
              union
              --curr=>next
              SELECT
                  DB_QUE.pfd_period_no,
                  DB_QUE.wk,
                  sum(DB_QUE.qty_fc) as qty_fc
              from
              (
              SELECT
                  (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6)) as pfd_period_no,
                  pf.wk,
                  SUM(-pf.qty_fc) as qty_fc,
                  NULL as update_datetime,
                  NULL as id
              FROM pln.pln_fc pf
              WHERE pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYYWW'), 1, 6))
                  AND pf.pfd_period_no <= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYYWW'), 1, 6))
                  AND pf.prd_series like $1 || '%'
                  AND SUBSTR(pf.wk, 3, 4) >= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '7 DAYS', 'YYYYWW'), 3, 4))
                  AND SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '70 DAYS', 'YYYYWW'), 3, 4))
              GROUP BY pf.pfd_period_no, pf.wk
              UNION
              SELECT
                  pf.pfd_period_no,
                  pf.wk,
                  SUM(pf.qty_fc) as qty_fc,
                  NULL as update_datetime,
                  NULL as id
              FROM pln.pln_fc pf
              WHERE pf.pfd_period_no >= (SELECT substring(TO_CHAR(CURRENT_DATE - INTERVAL '0 days', 'YYYYWW'), 1, 6))
                  AND pf.prd_series like $1 || '%'
                  AND SUBSTR(pf.wk, 3, 4) >= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '7 DAYS', 'YYYYWW'), 3, 4))
                  AND SUBSTR(pf.wk, 3, 4) <= (SELECT SUBSTR(TO_CHAR(CURRENT_DATE + INTERVAL '70 DAYS', 'YYYYWW'), 3, 4))
              GROUP BY pf.pfd_period_no, pf.wk) DB_QUE
              GROUP BY DB_QUE.pfd_period_no, DB_QUE.wk
              ) DB_ALL
              order by DB_ALL.pfd_period_no , DB_ALL.wk`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_PO_bal_only
router.get("/filter-po-bal-detail-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select *
              from pln.pln_pobal_detail ppd 
              where ppd.prd_name like $1 || '%'
              order by ppd.due_date ASC, ppd.prd_name , ppd.so_line , ppd.so_no`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select *
              from pln.pln_pobal_detail ppd 
              where ppd.prd_series like $1 || '%'
              order by ppd.due_date ASC, ppd.prd_name , ppd.so_line , ppd.so_no`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_WIP_Pending
router.get("/filter-wip-pending-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select  sum(pwp.qty_pending) as qty_pending
              from pln.pln_wip_pending pwp 
              where pwp.prd_name like $1 || '%'
              group by pwp.prd_series`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pwp.prd_series 
                      ,sum(pwp.qty_pending) as qty_pending
              from pln.pln_wip_pending pwp 
              where pwp.prd_series like $1 || '%'
              group by pwp.prd_series`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_FG_Unmovement
router.get("/filter-fg-unmovement-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select  pfu.wk
                      ,sum(pfu.qty_hold) as qty_hold
              from pln.pln_fg_unmovement pfu 
              where pfu.prd_name like $1 || '%'
              group by pfu.wk `, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfu.wk
                      ,pfu.prd_series
                      ,sum(pfu.qty_hold) as qty_hold
              from pln.pln_fg_unmovement pfu 
              where pfu.prd_series like $1 || '%'
              group by pfu.wk , pfu.prd_series`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_FG_Details
router.get("/filter-fg-details-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfd.wk 
                  ,pfd.prd_name 
                  ,pfd.prd_series 
                  ,pfd.ld_loc 
                  ,pfd.ld_status 
                  ,pfd.qty_good 
              from pln.pln_fg_detail pfd 
              where pfd.prd_name like $1 || '%'
              and pfd.qty_good > 0
              order by pfd.prd_name  , pfd.ld_loc`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfd.wk 
                  ,pfd.prd_name 
                  ,pfd.prd_series 
                  ,pfd.ld_loc 
                  ,pfd.ld_status 
                  ,pfd.qty_good 
              from pln.pln_fg_detail pfd 
              where pfd.prd_series like $1 || '%'
              and pfd.qty_good > 0
              order by pfd.prd_name  , pfd.ld_loc`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_FG_Unmovement_details
router.get("/filter-fg-unmovement-details-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfu.wk 
                  ,pfu.prd_name 
                  ,pfu.prd_series 
                  ,pfu.ld_loc 
                  ,pfu.ld_status
                  ,pfu.qty_hold 
              from pln.pln_fg_unmovement pfu 
              where pfu.prd_name like $1 || '%'
              and pfu.qty_hold > 0
              order by pfu.prd_name , pfu.ld_loc`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select 	pfu.wk 
                  ,pfu.prd_name 
                  ,pfu.prd_series 
                  ,pfu.ld_loc 
                  ,pfu.ld_status
                  ,pfu.qty_hold 
              from pln.pln_fg_unmovement pfu 
              where pfu.prd_series like $1 || '%'
              and pfu.qty_hold > 0
              order by pfu.prd_name , pfu.ld_loc`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_WIP_Pending_Details
router.get("/filter-wip-pending-detail-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pwpd.prd_name 
                  ,pwpd.lot 
                  ,pwpd.prd_series 
                  ,pwpd.factory 
                  ,pwpd.unit 
                  ,pwpd.process 
                  ,pwpd.pending_reason 
                  ,pwpd.qty_pending 
              from pln.pln_wip_pending_details pwpd 
              where pwpd.prd_name like $1 || '%'
              and pwpd.qty_pending > 0
              order by pwpd.prd_name , pwpd.lot , pwpd.unit , pwpd.process`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pwpd.prd_name 
                  ,pwpd.lot 
                  ,pwpd.prd_series 
                  ,pwpd.factory 
                  ,pwpd.unit 
                  ,pwpd.process 
                  ,pwpd.pending_reason 
                  ,pwpd.qty_pending 
              from pln.pln_wip_pending_details pwpd 
              where pwpd.prd_series like $1 || '%'
              and pwpd.qty_pending > 0
              order by pwpd.prd_name , pwpd.lot , pwpd.unit , pwpd.process`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_WIP_Details_OK
router.get("/filter-wip-detail-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select 	pwd.prd_name
                      ,pwd.prd_series
                      ,pwd.factory
                      ,pwd.unit
                      ,pwd.process
                      ,pwd.qty_wip_detail 
                      ,pwd.ro_rev 
                      ,pwd.ro_seq 
              from pln.pln_wip_detail pwd 
              where case when LENGTH($1) <= 10 then pwd.prd_name like $1 || '%'
                      else pwd.prd_name = $1 end 
              and pwd.qty_wip_detail > 0
              order by pwd.prd_name , pwd.ro_rev , pwd.ro_seq desc `, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select 	pwd.prd_name
                      ,pwd.prd_series
                      ,pwd.factory
                      ,pwd.unit
                      ,pwd.process
                      ,pwd.qty_wip_detail 
                      ,pwd.ro_rev 
                      ,pwd.ro_seq 
              from pln.pln_wip_detail pwd 
              where pwd.prd_series like $1 || '%'
              and pwd.qty_wip_detail > 0
              order by pwd.prd_name , pwd.ro_rev , pwd.ro_seq desc `, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_WIP_Details_OK
router.get("/filter-fc-accuracy-product-series", async(req, res) => {
    try {
        const client = await pool.connect();
        const prd_name = req.query.prd_name;
        const prd_series = req.query.prd_series;

        if (prd_series == 'Series') {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfasb.wk 
                      ,ROUND(avg(pfasb.fc_accuracy),2) as fc_accuracy 
              from pln.pln_fc_accuracy_sale_branch pfasb 
              where 	case when LENGTH($1) <= 10 then pfasb.prd_name like $1 || '%'
                      else pfasb.prd_name = $1 end 
              group by pfasb.wk
              order by pfasb.wk`, [prd_name]
            );
            client.release();
            res.json(result.rows);
        } else {
            // const prd_name = req.query.prd_name;
            const result = await client.query(
                `select pfasb.wk 
                      --,LEFT(pfasb.prd_version, 3) AS prd_series
                      --,pfasb.prd_version 
                      ,ROUND(avg(pfasb.fc_accuracy),2) as fc_accuracy
              from pln.pln_fc_accuracy_sale_branch pfasb 
              where 	case when LENGTH($1) <= 10 then pfasb.prd_version like $1 || '%'
                      else pfasb.prd_version = $1 end
              group by pfasb.wk , LEFT(pfasb.prd_version, 3)
              order by pfasb.wk`, [prd_series]
            );
            client.release();
            res.json(result.rows);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

//Plannig Forecast Vs PO
//Filter_WIP_Details_OK
router.get("/filter-summary-fc-accuracy-product-series", async(req, res) => {

})

module.exports = router;