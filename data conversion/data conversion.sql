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
        smpl.life_stg_cd
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
),
sample_data AS (
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
        null                                        AS "Result Value",
        null                                   AS "Method Detection Limit",
        null   AS "Method Detection Limit Source 2",        
        NULL                                                         AS "Method Reporting Limit", -- leave as blank
        null                                                AS "Result Unit",
        null AS "EMS Result Unit",
        null                                            AS "MDL Unit",
        null                                               AS "Detection Condition",
        NULL                                                         AS "Limit Type",
        NULL                                                         AS "Source of Rounded Value", -- can be blank
        NULL                                                         AS "Rounded Value", -- can be blank
        NULL                                                         AS "Rounding Specification", -- can be blank
        cl2.short_name                                               AS "Analyzing Agency",
        null                                        AS "Analysis Method",
        null AS "Analyzed Date Time",
        'Preliminary'                                                AS "Result Status",
        'Ungraded'                                                   AS "Result Grade",
        NULL                                                         AS "Activity ID",
        smpl.id                                               AS "Activity Name",
        tt.description                                               AS "Tissue Type", -- blank for this query, but not necessarily true for tax. and air
        smpl.tissue_typ_cd,
        null AS "SPECIES",
        smpl.lab_arrival_temperature                                 AS "Lab Arrival Temperature",
        NULL                                                         AS "Lab Quality Flag",-- leave blank
        CASE 
            WHEN smpl.lab_arrival_date IS NULL THEN NULL
            ELSE to_char(smpl.lab_arrival_date, 'YYYY-MM-DD"T"HH24:MI:SS') || '-08:00'      
        END AS "Lab Arrival Date and Time",        
        NULL                                                         AS "Lab Prepared DateTime",-- leave blank
        null                                         AS "Lab Sample ID",
        NULL                                                         AS "Lab Dilution Factor",-- leave blank
        smpl.lab_comment                                             AS "Lab Comment",
        null                                          AS "Lab Batch ID",
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
        ''                                                         AS "QC Source Activity Name",-- leave as blank
        NULL                                                         AS "Composite Stat",-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes
        null as parm_cd ,
        null as result_unit_code,
        null as mdl_unit_code,
        smpl.flow as "Air Flow Volume", -- convert to rows and add to activity result (data classification) - "ACTIVITY_RESULT" - no method, no 
        flow_unit.short_name as "Air Flow Unit Code",
        smpl.filter_size as "Air Filter Size",
        smpl.BIO_SAMPLE_AREA,
        vu.code as BIO_SAMPLE_AREA_CODE,
        smpl.BIO_SAMPLE_VOLUME,
        vu.code as BIO_SAMPLE_VOLUME_CODE,
        smpl.BIO_SAMPLE_WEIGHT,
        vu.code as BIO_SAMPLE_WEIGHT_CODE,
        null as CONTINUOUS_MINIMUM,
        null as CONTINUOUS_MAXIMUM,
        null as CONTINUOUS_AVERAGE,
        smpl.SIZE_FROM,
        smpl.SIZE_TO,
        smpl.WEIGHT_FROM,
        smpl.WEIGHT_TO,
        smpl.life_stg_cd
    FROM
        ems_samples smpl
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
    
) -- sample data
select "Observation ID",
        "Ministry Contact",
        "Sampling Agency",
        "Project",
        "Work Order Number",
        "Location ID",
        "Field Visit Start Time", -- required
        "Field Visit End Time",
        "Field Visit Participants",
        "Activity Comments" as "Field Visit Comments",
        "Activity Comments",
        "Field Filtered",
        "Field Filtered Comment",
        "Field Preservative",
        "Field Device ID",-- leave as blank
        "Field Device Type",
        "Sampling Context Tag",
        "Collection Method",
        "Medium",
        "Depth Upper",
        "Depth Lower",
        "Depth Unit",
        TO_CHAR (
            TO_TIMESTAMP (
                SUBSTR ("Observed DateTime", 1, 19),
                'YYYY-MM-DD"T"HH24:MI:SS'
            ) + NUMTODSINTERVAL (duplicate_row_number - 1, 'SECOND'),
            'YYYY-MM-DD"T"HH24:MI:SS'
        ) || '-08:00' AS "Observed DateTime",
        "Observed Date Time End",
        "Observed Property ID",-- based on the analytical method and parameter code and unit
        "Result Value",
        "Method Detection Limit", 
        "Method Reporting Limit",
        "Result Unit",
        "Detection Condition",
        "Limit Type",-- doesn't exist in ems  
        "Fraction",
        "Data Classification",
        "Source of Rounded Value",
        "Rounded Value",
        "Rounding Specification",
        "Analyzing Agency",
        case when "Data Classification" = 'FIELD_RESULT' then null else "Analysis Method" end as "Analysis Method",
        "Analyzed Date Time", -- add date/time mask
        "Result Status",
        "Result Grade",
        "Activity ID",
        case when "Data Classification" = 'FIELD_RESULT' then null else "Activity Name" end as "Activity Name",
        "Tissue Type",
        "Lab Arrival Temperature",
        CASE
            WHEN "Specimen Name" IS NULL AND "Data Classification" IN ('LAB', 'SURROGATE_RESULT') THEN to_char("Activity Name")
            WHEN "Specimen Name" IS NULL THEN ''
            WHEN duplicate_row_number > 1 THEN "Specimen Name" || '-' || duplicate_row_number
            ELSE "Specimen Name"
        END AS "Specimen Name",
        "Lab Quality Flag",
        "Lab Arrival Date and Time",
        "Lab Prepared DateTime",
        "Lab Sample ID",
        "Lab Dilution Factor" as "Lab Dilution Factor",
        "Lab Comment" as "Lab Comment",
        "Lab Batch ID",
        "QC Type",
        "QC Source Activity Name",
        "Composite Stat"

from(
select "Observation ID",
        "Ministry Contact",
        "Sampling Agency",
        "Project",
        "Work Order Number",
        "Location ID",
        "Field Visit Start Time", -- required
        "Field Visit End Time",
        "Field Visit Participants",
        "Activity Comments" as "Field Visit Comments",
        "Activity Comments",
        "Field Filtered",
        "Field Filtered Comment",
        "Field Preservative",
        "Field Device ID",-- leave as blank
        "Field Device Type",
        "Sampling Context Tag",
        "Collection Method",
        "Medium",
        "Depth Upper",
        "Depth Lower",
        "Depth Unit",
        "Observed DateTime",
        "Observed Date Time End",
        "Observed Property ID",-- based on the analytical method and parameter code and unit
        "Result Value",
        "Method Detection Limit", 
        "Method Reporting Limit",
        "Result Unit",
        "Detection Condition",
        "Limit Type",-- doesn't exist in ems  
        "Fraction",
        "Data Classification",
        "Source of Rounded Value",
        "Rounded Value",
        "Rounding Specification",
        "Analyzing Agency",
        "Analysis Method", -- removed as per request from Jeremy.  The METHOD name was moved to field device type column
        "Analyzed Date Time", -- add date/time mask
        "Result Status",
        "Result Grade",
        "Activity ID",
        "Activity Name",
        "Tissue Type",
        "Lab Arrival Temperature",
        "Specimen Name",
        "Lab Quality Flag",
        "Lab Arrival Date and Time",
        "Lab Prepared DateTime",
        "Lab Sample ID",
        "Lab Dilution Factor" as "Lab Dilution Factor",
        "Lab Comment" as "Lab Comment",
        "Lab Batch ID",
        "QC Type",
        "QC Source Activity Name",
        "Composite Stat",
        ROW_NUMBER() OVER (
            PARTITION BY 
                "Location ID", 
                "Field Visit Start Time", 
                "Medium", 
                "Depth Upper", 
                CASE 
                    WHEN "Data Classification" IN ('FIELD_RESULT') THEN ''
                    ELSE COALESCE(to_char("Activity Name"), '')
                END, 
                COALESCE("Specimen Name", ''),
                "Data Classification", 
                CASE 
                    WHEN "Data Classification" IN ('FIELD_RESULT', 'VERTICAL_PROFILE') THEN null
                    ELSE "QC Type"
                END, 
                "Observed Property ID"
            ORDER BY TO_TIMESTAMP(SUBSTR("Observed DateTime", 1, 19), 'YYYY-MM-DD"T"HH24:MI:SS')
        ) AS duplicate_row_number
from (

-- water data

SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",-- based on the analytical method and parameter code and unit
        core."Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        ed.Classification as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE 
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT')
                THEN COALESCE(
                    "Analyzed Date Time",
                    core."Observed DateTime"
                )
            ELSE core."Analyzed Date Time"
        END AS "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        CASE
            WHEN ed.Classification IN ('FIELD_RESULT', 'VERTICAL_PROFILE', 'FIELD_SURVEY') 
            THEN '' 
            ELSE RTRIM(ed.OP_Group, '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"
        --debugging
        ,
        core.parm_cd as "DEBUGGING parm_cd",
        core."Analysis Method" as "DEBUGGING ANALYSIS METHOD",
        core."EMS Result Unit" as "DEBUGGING RESULT UNIT",
        core."Analyzed Date Time" as "DEBUGGING ANALYZSED DATE TIME",
        core."Observed DateTime" as "DEBUGGING OBSERVED DATE TIME"

FROM -- water data
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where core.result_unit_code is not null and core.mdl_unit_code is not null
    AND (
        upper(core."Medium") LIKE '%WATER%' 
        OR core."Medium" = 'Solids - Soil'
    )
    --AND core."Work Order Number" IN ( -- remove this to get all results
    --        SELECT
    --            to_char(l.req_id)
    --        FROM
    --            ems.reqs_to_load l)
    AND ed.NewNameID is not null
                order by core."Location ID" asc, core."Observed DateTime" asc

-- end water data

/*
union all -- air data
*/
/*
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",-- based on the analytical method and parameter code and unit
        core."Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        core."Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        ed.Classification as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        CASE
            WHEN ed.Classification IN ('FIELD_RESULT', 'VERTICAL_PROFILE', 'FIELD_SURVEY') 
            THEN '' 
            ELSE RTRIM(ed.OP_Group, '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM -- air data
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where core.result_unit_code is not null and core.mdl_unit_code is not null
        -- save result ids where the data can't be uploaded
        -- sort on monitoring location id and date, asc
    AND upper(core."Medium") like '%AIR%' -- try WATER-MARINE for a subset
    AND ed.NewNameID is not null
    -- end air data
    
union -- flow volume
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        'Air Volume (vol.)' AS "Observed Property ID",-- based on the analytical method and parameter code and unit
        core."Air Flow Volume" as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Air Flow Unit Code" as "Result Unit", -- for when air flow volume is not null use the air flow unit code
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'ACTIVITY_RESULT' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        null AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM -- water data - air flow volume
    sample_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where upper(core."Medium") like '%AIR%' -- try WATER-MARINE for a subset
    and core."Air Flow Volume" is not null
    and core."Air Flow Unit Code" is not null
    and core."Air Filter Size" is not null
    AND ed.NewNameID is not null
    -- end air flow rate
union -- air filter size
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        'Air Filter Size (len.)' AS "Observed Property ID",
        core."Air Filter Size" as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        'um' as "Result Unit", -- for when air flow volume is not null use the air flow unit code
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'ACTIVITY_RESULT' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        null AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM -- air flow volume
    sample_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where upper(core."Medium") like '%AIR%' -- try WATER-MARINE for a subset
    and core."Air Flow Volume" is not null
    and core."Air Flow Unit Code" is not null
    and core."Air Filter Size" is not null
    AND ed.NewNameID is not null
-- end air filter size
*/
/*
union -- taxonomic data - bio sample area


SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        tax_cw.NewNameID AS "Observed Property ID",
        core.BIO_SAMPLE_AREA as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core.BIO_SAMPLE_AREA_CODE as "Result Unit", -- for when air flow volume is not null use the air flow unit code
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'ACTIVITY_RESULT' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        WHEN ed.Classification IN ('FIELD_RESULT', 'VERTICAL_PROFILE', 'FIELD_SURVEY') 
            THEN '' 
            WHEN duplicate_row_number > 1 THEN RTRIM(ed.OP_Group, '; ') || '-' || duplicate_row_number
            ELSE RTRIM(ed.OP_Group, '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat",-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
-- troubleshooting
        core.parm_cd, -- for troubleshooting
        core."Analysis Method", -- for troubleshooting
        core."Result Unit", -- for troubleshooting     
        core.BIO_SAMPLE_AREA_CODE as "TAX UNIT CODE",
        core."MDL Unit", -- for troubleshooting,
        core.mdl_unit_code,
        core.result_unit_code,
        core.tax_nm_cd

FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
        left outer join ems.ems_etl_tax_crosswalk_temp tax_cw on core.tax_nm_cd = tax_cw.parm_code
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where (INSTR(UPPER(core."Medium"), 'ANIMAL') > 0
        or INSTR(UPPER(core."Medium"), 'PLANT') > 0)
    and core.BIO_SAMPLE_AREA is not null
    -- end of taxonomic data - bio sample area
union -- taxonomic data - bio sample volume
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        tax_cw.NewNameID AS "Observed Property ID",
        core.BIO_SAMPLE_VOLUME as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core.BIO_SAMPLE_VOLUME_CODE as "Result Unit", 
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'ACTIVITY_RESULT' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        CASE 
            WHEN upper(core."Medium") = 'PLANT - PHYTOPLANKTON'
                THEN 'Phytoplankton'
            WHEN upper(core."Medium") = 'ANIMAL - ZOOPLANKTON' 
                THEN 'Phytoplankton'
            WHEN upper(core."Medium") = 'PLANT - PERIPHYTON' 
                THEN 'Phytoplankton'        
            ELSE RTRIM(core."Medium", '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat",-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        -- troubleshooting
        core.parm_cd, -- for troubleshooting
        core."Analysis Method", -- for troubleshooting
        core."Result Unit", -- for troubleshooting   
        core.BIO_SAMPLE_VOLUME_CODE as "TAX UNIT CODE",
        core."MDL Unit", -- for troubleshooting,
        core.mdl_unit_code,
        core.result_unit_code,
        core.tax_nm_cd
FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
    left outer join ems.ems_etl_tax_crosswalk_temp tax_cw on core.tax_nm_cd = tax_cw.parm_code
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where (INSTR(UPPER(core."Medium"), 'ANIMAL') > 0
        or INSTR(UPPER(core."Medium"), 'PLANT') > 0)
    and core.BIO_SAMPLE_VOLUME is not null
    -- end of taxonomic data - volume
union  -- taxonomic data - bio weight
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        tax_cw.NewNameID AS "Observed Property ID",
        core.BIO_SAMPLE_WEIGHT as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core.BIO_SAMPLE_WEIGHT_CODE as "Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'ACTIVITY_RESULT' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        CASE 
            WHEN upper(core."Medium") = 'PLANT - PHYTOPLANKTON'
                THEN 'Phytoplankton'
            WHEN upper(core."Medium") = 'ANIMAL - ZOOPLANKTON' 
                THEN 'Phytoplankton'
            WHEN upper(core."Medium") = 'PLANT - PERIPHYTON' 
                THEN 'Phytoplankton'        
            ELSE RTRIM(core."Medium", '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat",-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        -- troubleshooting
        core.parm_cd, -- for troubleshooting
        core."Analysis Method", -- for troubleshooting
        core."Result Unit", -- for troubleshooting     
        core."MDL Unit", -- for troubleshooting,
        core.BIO_SAMPLE_WEIGHT_CODE as "TAX UNIT CODE",
        core.mdl_unit_code,
        core.result_unit_code,
        core.tax_nm_cd
FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
left outer join ems.ems_etl_tax_crosswalk_temp tax_cw on core.tax_nm_cd = tax_cw.parm_code
where (INSTR(UPPER(core."Medium"), 'ANIMAL') > 0
        or INSTR(UPPER(core."Medium"), 'PLANT') > 0)
    and core.BIO_SAMPLE_WEIGHT is not null
    
-- end taxonomic export
*/
-- fish data - chemistry data
/*
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",-- based on the analytical method and parameter code and unit
        core."Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        ed.Classification as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        COALESCE(core."Tissue Type", 'Unknown') AS "Tissue Type",
        core.tissue_typ_cd,
        core."Lab Arrival Temperature",
        CASE 
        WHEN ed.Classification IN ('FIELD_RESULT', 'VERTICAL_PROFILE', 'FIELD_SURVEY') 
            THEN '' 
            WHEN duplicate_row_number > 1 THEN RTRIM(ed.OP_Group, '; ') || '-' || duplicate_row_number
            ELSE RTRIM(ed.OP_Group, '; ') 
        END AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        --core.parm_cd, -- for troubleshooting
        --core."Analysis Method", -- for troubleshooting
        --core."Result Unit", -- for troubleshooting     
        --core."MDL Unit", -- for troubleshooting,
        --core.mdl_unit_code,
        --core.result_unit_code
FROM -- fish data
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where INSTR(UPPER(core."Medium"), 'ANIMAL - FISH') > 0
-- end fish chemistry
union
-- begin fish fork length
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        null as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        'Fish Fork Length (len.)' AS "Observed Property ID",
        (nvl(core.size_from,0) + nvl(core.size_to,0)) / 2 AS "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        null as "Fraction",
        null as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        COALESCE(core."Tissue Type", 'Unknown') AS "Tissue Type",
        core.tissue_typ_cd,
        core."Lab Arrival Temperature",
        null AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        --core.parm_cd, -- for troubleshooting
        --core."Analysis Method", -- for troubleshooting
        --core."Result Unit", -- for troubleshooting     
        --core."MDL Unit", -- for troubleshooting,
        --core.mdl_unit_code,
        --core.result_unit_code
FROM -- fish data
    sample_data core
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where INSTR(UPPER(core."Medium"), 'ANIMAL - FISH') > 0
and ((nvl(core.size_from,0) + nvl(core.size_to,0))) > 0
    -- end fo fish fork length

union
-- begin fish weight
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        null as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        'Fish Weight (mass)' AS "Observed Property ID",
        ((nvl(core.weight_from,0) + nvl(core.weight_to,0)) / 2) as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        null as "Fraction",
        null as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN upper(ed.Classification) IN ('LAB', 'SURROGATE_RESULT') and core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        COALESCE(core."Tissue Type", 'Unknown') AS "Tissue Type",
        core.tissue_typ_cd,
        core."Lab Arrival Temperature",
        null AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        core."Composite Stat"-- ea on observation level in enmods.  "Minimum, mean, and average... not used for lakes, but will be required on other extracts).  This will be in the results table.  Blank for lakes.
        --core.parm_cd, -- for troubleshooting
        --core."Analysis Method", -- for troubleshooting
        --core."Result Unit", -- for troubleshooting     
        --core."MDL Unit", -- for troubleshooting,
        --core.mdl_unit_code,
        --core.result_unit_code
FROM -- fish data
    core_data core
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where INSTR(UPPER(core."Medium"), 'ANIMAL - FISH') > 0
and (nvl(core.weight_from,0)) > 0
    -- end fo fish mass
    -- end fish data    
*/
-- begin continuous data
-- union -- continuous data - CONTINUOUS_AVERAGE
/*
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",
        core.CONTINUOUS_AVERAGE as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit" as "Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'LAB' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        'continuous mean' AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        'Mean' as "Composite Stat"
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where --upper(core."Medium") like '%WATER - WASTE%' -- try WATER-MARINE for a subset
--upper(core."Collection Method") like '%CONTINUOUS%'
    core.CONTINUOUS_AVERAGE is not null
    AND ed.NewNameID is not null
union  -- continuous data - CONTINUOUS_MAXIMUM
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",
        core.CONTINUOUS_MAXIMUM as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit" as "Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'LAB' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        'continuous max' AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        'Maximum' as "Composite Stat"
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where --upper(core."Medium") like '%WATER - WASTE%' -- try WATER-MARINE for a subset
--upper(core."Collection Method") like '%CONTINUOUS%'
    core.CONTINUOUS_MAXIMUM is not null
    AND ed.NewNameID is not null
union all  -- continuous data - CONTINUOUS_MINIMUM
SELECT
        ''  as "Observation ID",
        core."Ministry Contact",
        core."Sampling Agency",
        core."Project",
        core."Work Order Number",
        core."Location ID",
        core."Field Visit Start Time", -- required
        core."Field Visit End Time",
        core."Field Visit Participants",
        '' as "Field Visit Comments",
        core."Activity Comments",
        core."Field Filtered",
        core."Field Filtered Comment",
        core."Field Preservative",
        NULL AS "Field Device ID",-- leave as blank
        ed.Device_Type as "Field Device Type",
        core."Sampling Context Tag",
        core."Collection Method",
        core."Medium",
        core."Depth Upper",
        core."Depth Lower",
        core."Depth Unit",
        core."Observed DateTime",
        core."Observed Date Time End",
        ed.NewNameID AS "Observed Property ID",
        core.CONTINUOUS_MINIMUM as "Result Value",
        --core."Method Detection Limit" as "UNCONVERTED_MDL",-- the unit may not be accurate.  Conversion may be needed.  This is the lab based limit.  If the result from the lab is missing, we can get from the analytical methods table
        --unit_conversion.source_unit_id,
        --unit_conversion.target_unit_id,
        --unit_conversion.conversion_factor,
        CASE
            WHEN core."Method Detection Limit" is null THEN core."Method Detection Limit Source 2"
            WHEN core."MDL Unit" <> core."Result Unit" THEN
                core."Method Detection Limit" / unit_conversion.conversion_factor
                --unit_conversion.conversion_factor
        ELSE core."Method Detection Limit" -- No conversion needed
        END AS "Method Detection Limit", 
        --core."Method Detection Limit" as "Method Detection Limit OG", -- debugging
        --unit_conversion.conversion_factor, -- debugging,
        --core."MDL Unit", core."Result Unit", -- debugging
        core."Method Reporting Limit",
        
        core."Result Unit" as "Result Unit",
        core."Detection Condition",
        core."Limit Type",-- doesn't exist in ems  
        ed.Fraction as "Fraction",
        'LAB' as "Data Classification",
        core."Source of Rounded Value",
        core."Rounded Value",
        core."Rounding Specification",
        core."Analyzing Agency",
        core."Analysis Method",
        CASE
            WHEN core."Analyzed Date Time" is null then core."Observed DateTime"
            ELSE core."Analyzed Date Time"
        END as "Analyzed Date Time",
        core."Result Status",
        core."Result Grade",
        core."Activity ID",
        core."Activity Name",
        core."Tissue Type",
        core."Lab Arrival Temperature",
        'continuous min' AS "Specimen Name",
        core."Lab Quality Flag",
        core."Lab Arrival Date and Time",
        core."Lab Prepared DateTime",
        core."Lab Sample ID",
        core."Lab Dilution Factor" as "Lab Dilution Factor",
        core."Lab Comment" as "Lab Comment",
        core."Lab Batch ID",
        core."QC Type",
        core."QC Source Activity Name",
        'Minimum' as "Composite Stat"
        --debugging
        --,
        --core.parm_cd,
        --core."Analysis Method",
        --core."EMS Result Unit"
FROM
    core_data core
    left outer JOIN OBSERVED_PROPERTIES_FOR_ETL ed on core.parm_cd = ed.Parm_code
        and core."Analysis Method" = ed.Analysis_Method_Code
        and core."EMS Result Unit" = ed.Unit
left outer join ems.unit_conversions_temp unit_conversion on core.result_unit_code = unit_conversion.target_unit_id and core.mdl_unit_code = unit_conversion.source_unit_id      
where --upper(core."Medium") like '%WATER - WASTE%' -- try WATER-MARINE for a subset
--upper(core."Collection Method") like '%CONTINUOUS%'
        core.CONTINUOUS_MINIMUM is not null
        AND ed.NewNameID is not null
*/
-- end continuous

))
        --where duplicate_row_number =1
        where "Observed Property ID" is not null
        order by "Location ID" asc, "Observed DateTime" asc