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
-- to prevent double counting, like in cases where a record has an excluded medium and no oberved propert - these should just be counted once instead of twice
tagged_data AS (
  SELECT
    id,
    locntyp_cd,
    medium,
    CONTINUOUS_MINIMUM,
    NewNameID,
    CLCT_METHD_CD,
    
    CASE WHEN locntyp_cd LIKE 'D%' OR locntyp_cd LIKE 'P%' THEN 1 ELSE 0 END AS flag_locntyp,
    CASE WHEN NOT (
        UPPER(medium) LIKE '%WATER%' OR 
        UPPER(medium) LIKE '%AIR%' OR 
        UPPER(medium) = 'SOLIDS - SOIL' OR 
        UPPER(medium) = 'ANIMAL' OR 
        UPPER(medium) = 'PLANT'
    ) THEN 1 ELSE 0 END AS flag_medium,
    
    CASE WHEN CLCT_METHD_CD IN ('CMON', 'C03', 'C01') AND CONTINUOUS_MINIMUM IS NULL THEN 1 ELSE 0 END AS flag_continuous,
    CASE WHEN NewNameID IS NULL THEN 1 ELSE 0 END AS flag_newnameid
  FROM raw_core_data
),
final_counts AS (
  SELECT
    COUNT(*) AS total_raw,
    SUM(flag_locntyp) AS excluded_due_to_locntyp,
    SUM(flag_medium) AS excluded_due_to_medium,
    SUM(flag_continuous) AS excluded_due_to_continuous,
    SUM(flag_newnameid) AS excluded_due_to_missing_observed_property,
    SUM(
      CASE
        WHEN flag_locntyp = 1 OR flag_medium = 1 OR flag_continuous = 1 OR flag_newnameid = 1
        THEN 1
        ELSE 0
      END
    ) AS total_excluded_distinct

  FROM tagged_data
)
SELECT 
  total_raw,
  excluded_due_to_locntyp,
  excluded_due_to_medium,
  excluded_due_to_continuous,
  excluded_due_to_missing_observed_property,
  total_excluded_distinct,
  ROUND(total_excluded_distinct * 100.0 / total_raw, 2) AS percent_excluded
FROM final_counts;