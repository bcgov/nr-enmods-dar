set define off;
WITH core_data AS (
    SELECT DISTINCT
        ps.first_name || ' ' || ps.last_name                         AS "Ministry Contact",
        cl.id || ' - ' || cl.name                                    AS "Sampling Agency",
        'BCLMN'                                                      AS "Project",
        smpl.requisition_id                                          AS "Work Order Number",
        smpl.mon_locn_id                                             AS "Location ID",
        to_char(eal.earlieststarttime, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'    AS "Field Visit Start Time",
        case -- if earlieststarttime = latestendtime, Jeremy requested that we don't display the end date and time
            when eal.earlieststarttime = eal.latestendtime
                then null
            else
                to_char(eal.latestendtime, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'
        end AS "Field Visit End Time",
        smpl.sampler                                                 AS "Field Visit Participants",
        smpl.field_comment                                           AS "Activity Comments",
        NULL                                                         AS "Field Filtered", -- blank, doesn't exist in ems
        NULL                                                         AS "Field Filtered Comment", -- blank, doesn't exist in ems
        epc.description                                              AS "Field Preservative",-- updated to use descrsiption  note that only 3800 records of ~ 2 million records have a field preservative
        NULL                                                         AS "Sampling Context Tag", -- blank, doesn't exist in ems
        smpl.clct_methd_cd,
                CASE
            WHEN cm.code = '25' THEN 'Autosampler: Peristaltic Pump'
            WHEN cm.code = '025' THEN 'Autosampler: Peristaltic Pump'
            WHEN cm.code = 'FCFLOW' THEN 'Flow Proportional Composite'
            WHEN cm.code = 'FCTIME' THEN 'Flow Proportional Composite'
            WHEN cm.code = 'GRB' THEN 'Grab'
            WHEN cm.code = 'GEL' THEN 'Grab'
            WHEN cm.code = '16' THEN 'Grab'
            WHEN cm.code = '016' THEN 'Grab'
            WHEN cm.code = '8' THEN 'Grab'
            WHEN cm.code = '008' THEN 'Grab'
            WHEN cm.code = 'ELECTR' THEN 'Electrofishing'
            WHEN cm.code = 'IVKICK' THEN 'Invertebrate Kicknetting'
            WHEN cm.code = 'MNWTRP' THEN 'Minnow Trapping'
            WHEN cm.code = 'NET' THEN 'Netting (gill net or other)'
            WHEN cm.code = 'C04' THEN 'Paper Weighed on Scale'
            WHEN cm.code = 'SCPOOL' THEN 'Spatial Composite'
            WHEN cm.code = 'SCSRAM' THEN 'Spatial Composite: Simple Random'
            WHEN cm.code = 'SCHTOW' THEN 'Spatial Composite: Horizontal Tow'
            WHEN cm.code = 'SCTRAN' THEN 'Spatial Composite: Transect'
            WHEN cm.code = 'SCVERT' THEN 'Spatial Composite: Vertical'
            WHEN cm.code = 'TCDIS' THEN 'Time Composite: Discrete'
            WHEN cm.code = '31' THEN 'Time Composite: Discrete'
            WHEN cm.code = '031' THEN 'Time Composite: Discrete'
            WHEN cm.code = '14' THEN 'Time Composite: Discrete'
            WHEN cm.code = '014' THEN 'Time Composite: Discrete'
            WHEN cm.code = 'H01' THEN 'Time Composite: Discrete'
            WHEN cm.code = 'H02' THEN 'Time Composite: Discrete'
            WHEN cm.code = 'CMON' THEN 'Time Composite: Continuous Monitor'
            WHEN cm.code = 'C03' THEN 'Time Composite: Continuous Monitor'
            WHEN cm.code = 'C01' THEN 'Time Composite: Continuous Monitor'
            WHEN cm.code = 'TCCON' THEN 'Time Composite: HiVol'
            WHEN cm.code = 'TCSEG' THEN 'Time Composite: Segmented Discrete'
            WHEN cm.code = 'VRBL' THEN 'Variable Well Sampling'
            WHEN cm.code = '29' THEN 'Variable Well Sampling'
            WHEN cm.code = '32' THEN 'Variable Well Sampling'
            WHEN cm.code = '029' THEN 'Variable Well Sampling'
            WHEN cm.code = '032' THEN 'Variable Well Sampling'
            WHEN cm.code = 'SCOBLQ' THEN 'DELETE' -- don't display this row
            WHEN cm.code = 'CFLOW' THEN 'DELETE' -- don't display this row
            WHEN cm.code = '30' THEN 'DELETE' -- don't display this row
            WHEN cm.code = '030' THEN 'DELETE' -- don't display this row
            WHEN cm.code = 'PDW' THEN 'DELETE' -- don't display this row
            WHEN cm.code = 'SCHTRL' THEN 'DELETE' -- don't display this row
            WHEN NULLIF(cm.code, '') IS NULL THEN 'Unknown'
            ELSE cm.code
        END AS "Collection Method", -- still need to find source
        m.enmods_medium                                             AS "Medium",
        smpl.depth_upper                                             AS "Depth Upper",
        smpl.depth_lower                                             AS "Depth Lower",
        case 
            when smpl.depth_upper is null and smpl.depth_lower is null then null
            else 'metre'                                                          
        end AS "Depth Unit",
        to_char(smpl.collection_start_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00' AS "Observed DateTime",
        case -- if earlieststarttime = latestendtime, Jeremy requested that we don't display the end date and time
            when smpl.collection_start_date = smpl.collection_end_date
                then null
            else
                to_char(smpl.collection_end_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'
        end AS "Observed Date Time End",        
        result.result_numeric                                        AS "Result Value",
        result.method_detect_limit                                   AS "Method Detection Limit",
        d.METHOD_DETECT_LIMIT   AS "Method Detection Limit Source 2",        
        NULL                                                         AS "Method Reporting Limit", -- leave as blank
        aqs_units.AQS_NAME_ON_IMPORT                                                AS "Result Unit",
        mu.short_name AS "EMS Result Unit",
        mu_mdl.short_name                                            AS "MDL Unit",
        CASE
            WHEN result.result_letter = '<' THEN
                'NOT_DETECTED'
            ELSE
                NULL
        END                                                          AS "Detection Condition",
        NULL                                                         AS "Limit Type",
        NULL                                                         AS "Source of Rounded Value", -- can be blank
        NULL                                                         AS "Rounded Value", -- can be blank
        NULL                                                         AS "Rounding Specification", -- can be blank
        cl2.short_name                                               AS "Analyzing Agency",
        result.anal_method_cd                                        AS "Analysis Method",
        CASE 
            WHEN result.analytical_date IS NULL THEN NULL
            ELSE to_char(result.analytical_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'
        END AS "Analyzed Date Time",
        'Preliminary'                                                AS "Result Status",
        'Ungraded'                                                   AS "Result Grade",
        NULL                                                         AS "Activity ID",
        smpl.id                                                      AS "Activity Name",
        tt.description                                               AS "Tissue Type", -- blank for this query, but not necessarily true for tax. and air
        smpl.tissue_typ_cd,
        esp.DESCRIPTION AS "SPECIES",
        result.tax_nm_cd,
        smpl.lab_arrival_temperature                                 AS "Lab Arrival Temperature",
        NULL                                                         AS "Lab Quality Flag",-- leave blank
        CASE 
            WHEN smpl.lab_arrival_date IS NULL THEN NULL
            ELSE to_char(smpl.lab_arrival_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'      
        END AS "Lab Arrival Date and Time",        
        NULL                                                         AS "Lab Prepared DateTime",-- leave blank
        result.lab_sample_id                                         AS "Lab Sample ID",
        NULL                                                         AS "Lab Dilution Factor",-- leave blank
        smpl.lab_comment                                             AS "Lab Comment",
        result.lab_batch_id                                          AS "Lab Batch ID",
        CASE
            WHEN sc.description IN ( 'Replicate', 'Replicate-First', 'Replicate-Second', 'Replicate-Third' ) THEN
                'Replicate'
            WHEN upper(sc.description) LIKE '%BLANK%' THEN
                'Blank'
            WHEN upper(sc.description) LIKE '%SPIKE%' THEN
                'Spike'
            ELSE
                ''
        END                                                          AS "QC Type",
        NULL                                                         AS "QC Source Activity Name",-- leave as blank
        NULL                                                         AS "Composite Stat",-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes
        result.parm_cd ,
        d.meas_unit_cd as result_unit_code,
        result.meas_unit_cd as mdl_unit_code,
        smpl.flow as "Air Flow Volume", -- convert to rows and add to activity result (data classification) - "ACTIVITY_RESULT" - no method, no 
        flow_unit.short_name as "Air Flow Unit Code",
        smpl.filter_size as "Air Filter Size",
        smpl.BIO_SAMPLE_AREA,
        au.short_name as BIO_SAMPLE_AREA_CODE,
        smpl.BIO_SAMPLE_VOLUME,
        vu.short_name as BIO_SAMPLE_VOLUME_CODE,
        smpl.BIO_SAMPLE_WEIGHT,
        wu.short_name as BIO_SAMPLE_WEIGHT_CODE,
        result.CONTINUOUS_MINIMUM,
        result.CONTINUOUS_MAXIMUM,
        result.CONTINUOUS_AVERAGE,
        smpl.SIZE_FROM,
        smpl.SIZE_TO,
        smpl.WEIGHT_FROM,
        smpl.WEIGHT_TO,
        smpl.life_stg_cd,
        param.description as "parameter_name",
        -- Generate row numbers based on duplicate criteria.  EMS allows these duplicates, but EDT doesn't, so we'll use this to turn "specimen" into a unique column by adding a -n suffix
        ROW_NUMBER() OVER (
            PARTITION BY smpl.mon_locn_id, result.parm_cd, smpl.collection_start_date, d.METHOD_DETECT_LIMIT, smpl.depth_upper, smpl.depth_lower, result.smpl_id
            ORDER BY eal.earlieststarttime
        ) AS duplicate_row_number
    FROM
        ems_samples smpl
        LEFT JOIN ems_results result ON smpl.id = result.smpl_id
        LEFT JOIN ems_monitoring_locations mloc ON smpl.mon_locn_id = mloc.id
        LEFT JOIN ems_location_types elt ON mloc.locntyp_cd = elt.code
        LEFT JOIN ems_location_purposes p ON mloc.locnpurpose_cd = p.code
        LEFT JOIN (
            SELECT
                pa.mon_locn_id,
                MAX(pa.permit_id) AS permit
            FROM
                ems_permit_assoc pa
            GROUP BY
                pa.mon_locn_id
        ) max_pa ON max_pa.mon_locn_id = mloc.id
        LEFT JOIN ems_permit_relationships pr ON pr.code = (
            SELECT
                pa.perm_rltn_code
            FROM
                ems_permit_assoc pa
            WHERE
                pa.mon_locn_id = mloc.id
            FETCH FIRST 1 ROWS ONLY
        )
        LEFT JOIN ems_discharge_medias dm ON mloc.dismedia_cd = dm.code
        LEFT JOIN ems_user_details eud ON smpl.ministry_contact = eud.id
        LEFT JOIN print.staffs ps ON eud.staff_id = ps.id
        LEFT JOIN ems_client_locations cl ON cl.id = smpl.cliloc_id_smpl_by
        LEFT JOIN ems_client_locations cl2 ON cl2.id = smpl.cliloc_id_anal_by
        LEFT JOIN ems_collection_methods cm ON smpl.clct_methd_cd = cm.code
        LEFT JOIN ems_sample_classes sc ON smpl.smpl_cls_cd = sc.code
        LEFT JOIN ems_sample_states ss ON smpl.smpl_st_cd = ss.code
        LEFT JOIN ems_sample_descriptors sd ON smpl.smpl_desc_cd = sd.code
        LEFT JOIN ems.ems_locn_state_descriptor_export_map m ON mloc.locntyp_cd = m.type
                                                                AND smpl.smpl_st_cd = m.state
                                                                AND smpl.smpl_desc_cd = m.descriptor
        LEFT JOIN ems_parameters param ON result.parm_cd = param.code
        LEFT JOIN ems_anal_methods am ON result.anal_method_cd = am.code
        LEFT JOIN ems_parm_dicts d on d.parm_cd = result.parm_cd
                AND d.anal_method_cd = result.anal_method_cd
        LEFT JOIN ems.AQS_UNITS_TEMP aqs_units ON aqs_units.EMS_CODE = d.meas_unit_cd
        LEFT JOIN ems_measurment_units mu ON mu.code = d.meas_unit_cd
        LEFT JOIN ems_measurment_units mu_mdl ON mu_mdl.code = result.meas_unit_cd
        LEFT JOIN ems_tides tide ON smpl.tide_cd = tide.code
        LEFT JOIN ems_measurment_units flow_unit ON flow_unit.code = smpl.flow_unit_cd
        LEFT JOIN ems_tissue_types tt ON smpl.tissue_typ_cd = tt.code
        LEFT JOIN ems_species sp ON smpl.species_cd = sp.code
        LEFT JOIN ems_sexes es ON smpl.sex_cd = es.code
        LEFT JOIN ems_life_stages ls ON smpl.life_stg_cd = ls.code
        LEFT JOIN ems_measurment_units vu ON vu.code = smpl.bio_smpl_vol_units_cd
        LEFT JOIN ems_measurment_units au ON au.code = smpl.bio_smpl_area_units_cd
        LEFT JOIN ems_measurment_units su ON su.code = smpl.size_units_cd
        LEFT JOIN ems_measurment_units wu ON wu.code = smpl.bio_smpl_weight_units_cd
        LEFT JOIN ems_species esp ON result.tax_nm_cd = esp.code
        LEFT JOIN ems_life_stages lfs ON result.life_stg_cd = lfs.code
        LEFT JOIN ems_preservatives epc ON smpl.preservative_cd = epc.code
        -- Inline subquery to get the earliest start and latest end times for each MON_LOCN_ID per day
        LEFT JOIN (
            SELECT
                mon_locn_id,
                trunc(collection_start_date) AS dateonly,
                MIN(collection_start_date)   AS earlieststarttime,
                MAX(collection_end_date)     AS latestendtime
            FROM
                ems_samples
            GROUP BY
                mon_locn_id,
                trunc(collection_start_date)
        ) eal ON smpl.mon_locn_id = eal.mon_locn_id
                 AND trunc(smpl.collection_start_date) = eal.dateonly
    WHERE
        mloc.locntyp_cd NOT LIKE 'D%' -- needed for all queries
        AND mloc.locntyp_cd NOT LIKE 'P%'
)
select core.parm_cd, core."parameter_name", core."Analysis Method",core."EMS Result Unit" 
from     core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
        where ed.Parm_code is null or ed.Analysis_Method_Code is null or ed.Unit is null
        group by core.parm_cd,core."Analysis Method",core."EMS Result Unit", core."parameter_name"
        