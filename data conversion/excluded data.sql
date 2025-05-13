-- all data, without any data filtered out
WITH raw_core_data AS (
  SELECT smpl.id,
         mloc.locntyp_cd,
         m.enmods_medium AS medium,
         result.CONTINUOUS_MINIMUM,
         ed.NewNameID,
         smpl.CLCT_METHD_CD
  FROM ems_samples smpl
    LEFT JOIN ems_results result ON smpl.id = result.smpl_id
    LEFT JOIN ems_monitoring_locations mloc ON smpl.mon_locn_id = mloc.id
    LEFT JOIN ems.ems_locn_state_descriptor_export_map m 
           ON mloc.locntyp_cd = m.type 
          AND smpl.smpl_st_cd = m.state 
          AND smpl.smpl_desc_cd = m.descriptor
    LEFT JOIN OBSERVED_PROPERTIES_FOR_ETL ed
           ON ed.Parm_code = result.parm_cd
          AND ed.Analysis_Method_Code = result.anal_method_cd
),
excluded_counts AS (
  SELECT
    COUNT(*) AS total_raw,

    SUM(CASE WHEN locntyp_cd LIKE 'D%' OR locntyp_cd LIKE 'P%' THEN 1 ELSE 0 END) AS excluded_due_to_locntyp,

    SUM(CASE 
        WHEN NOT (
          UPPER(medium) LIKE '%WATER%' OR 
          UPPER(medium) LIKE '%AIR%' OR 
          UPPER(medium) = 'SOLIDS - SOIL' OR 
          UPPER(medium) = 'ANIMAL' OR 
          UPPER(medium) = 'PLANT'
        ) THEN 1 ELSE 0 
    END) AS excluded_due_to_medium,

    SUM(CASE 
        WHEN CLCT_METHD_CD IN ('CMON', 'C03', 'C01')
             AND (CONTINUOUS_MINIMUM IS NULL OR NewNameID IS NULL)
        THEN 1 ELSE 0 
    END) AS excluded_due_to_continuous,

    SUM(CASE 
        WHEN NewNameID IS NULL THEN 1 ELSE 0 
    END) AS excluded_due_to_missing_observed_property

  FROM raw_core_data
)
-- output counts with some basic stats
SELECT 
  total_raw,
  excluded_due_to_locntyp,
  excluded_due_to_medium,
  excluded_due_to_continuous,
  excluded_due_to_missing_observed_property,

  -- Total of all exclusions (non-distinct)
  excluded_due_to_locntyp +
  excluded_due_to_medium +
  excluded_due_to_continuous +
  excluded_due_to_missing_observed_property AS total_excluded,

  -- Percent excluded
  ROUND(
    (
      excluded_due_to_locntyp +
      excluded_due_to_medium +
      excluded_due_to_continuous +
      excluded_due_to_missing_observed_property
    ) * 100.0 / total_raw, 
    2
  ) AS percent_excluded
FROM excluded_counts;