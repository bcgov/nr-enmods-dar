-- QUERY 1: All locations with Non Zero samples and after 2006
WITH a AS (
    SELECT
        s.mon_locn_id              "Locn_ID",
        COUNT(s.id)                "Samples",
        MAX(collection_start_date) "Max_Sample_Date",
        NULL                       "When Created",
        NULL                       "When Updated"
    FROM
        ems_samples s
    GROUP BY
        s.mon_locn_id
    HAVING
        COUNT(s.id) >= 1
    UNION
    SELECT
        l.id           "Locn_ID",
        NULL           "Samples",
        NULL           "Max_Sample_Date",
        l.when_created "When Created",
        l.when_updated "When Updated"
    FROM
        ems_monitoring_locations l
    WHERE
        (l.when_created > TO_DATE('2006-01-01', 'YYYY-MM-DD')
        OR l.when_updated > TO_DATE('2006-01-01', 'YYYY-MM-DD'))
), b AS (
    SELECT
        "Locn_ID",
        MAX("Samples")         "Samples",
        MAX("Max_Sample_Date") AS "Max_Sample_Date",
        MAX("When Created")    AS "When Created",
        MAX("When Updated")    AS "When Updated"
    FROM
        a
    GROUP BY
        "Locn_ID"
), permit_data AS (
    SELECT
        pa.mon_locn_id AS "Locn_ID",
        LISTAGG(pa.permit_id, '; ') WITHIN GROUP(
        ORDER BY
            pa.permit_id
        )              AS permit_ids
    FROM
        ems_permit_assoc pa
    GROUP BY
        pa.mon_locn_id
)
SELECT
    emslocn.id                  "Location ID",
    emslocn.name                "Name",
    (
        CASE
            WHEN locn_typ_map.ems_location_type = 'AMBIENT OR BACKGROUND AIR' THEN 'Air Quality'
            WHEN locn_typ_map.ems_location_type = 'COMBINED SEWER' THEN 'Combined Sewer'
            WHEN locn_typ_map.ems_location_type = 'CONTAMINATED SITE' THEN 'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'DITCH OR CULVERT'	THEN 'Ditch or Culvert'
            WHEN locn_typ_map.ems_location_type = 'ESTUARINE' THEN 'Estuary'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER SOURCE'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER TREATED'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'IN PLANT'	THEN 'In-Plant'
            WHEN locn_typ_map.ems_location_type = 'INFILTRATION POND' THEN 'Infiltration Pond'
            WHEN locn_typ_map.ems_location_type = 'IRRIGATION SPRAY/SLUDGE' THEN 'Irrigation Spray/Sludge'
            WHEN locn_typ_map.ems_location_type = 'LAKE OR POND' THEN 'Lake or Pond'
            WHEN locn_typ_map.ems_location_type = 'LAND - FARM' THEN 'Land - Farm'
            WHEN locn_typ_map.ems_location_type = 'LANDFILL'	THEN 'Landfill'
            WHEN locn_typ_map.ems_location_type = 'MARINE' THEN 'Marine'
            WHEN locn_typ_map.ems_location_type = 'MONITORING WELL' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'OPEN BURNING' THEN 'Open Burning'
            WHEN locn_typ_map.ems_location_type = 'OUTFALL' THEN 'Outfall'
            WHEN locn_typ_map.ems_location_type = 'PROVINCIAL OBS WELL NETWORK' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'RIVER,STREAM OR CREEK' THEN 'River, Stream, or Creek'
            WHEN locn_typ_map.ems_location_type = 'SEEPAGE OR SEEPAGE POOLS'	THEN 'Seepage or Seepage Pools'
            WHEN locn_typ_map.ems_location_type = 'SEPTIC TANK' THEN 'Septic Tank'
            WHEN locn_typ_map.ems_location_type = 'SNOW PACK' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SPRING OR HOT SPRING'	THEN 'Spring or Hot Spring'
            WHEN locn_typ_map.ems_location_type = 'STACK' THEN 'Stack'
            WHEN locn_typ_map.ems_location_type = 'STORAGE' THEN 'Storage'
            WHEN locn_typ_map.ems_location_type = 'STORMSEWER' THEN 'Storm Sewer'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER SOURCE'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'TERRESTRIAL' THEN 'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'TILE FIELD' THEN 'Tile Field'
            WHEN locn_typ_map.ems_location_type = 'WELL (LEGACY)' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB COMMERCIAL' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB PUBLIC' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL COMMERCIAL' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL PUBLIC' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED TREATED' THEN 'DO NOT MIGRATE'
        END
    )                           "Type",
    (
        CASE
            WHEN emslocn.mon_locn_comment IS NOT NULL THEN
                replace(replace((emslocn.description
                                 || ' Comments: '
                                 || emslocn.mon_locn_comment),
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
            WHEN emslocn.mon_locn_comment IS NULL THEN
                replace(replace(emslocn.description,
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
        END
    )                           "Comment",
    NULL                        "Country",
    NULL                        "State",
    NULL                        "County",
    emslocn.latitude            "Latitude",
    ( - 1 * emslocn.longitude ) "Longitude",
    NULL                        "Horizontal Datum",
    geo_sources.description     "Horizontal Collection Method",
    NULL                        "Vertical Datum",
    NULL                        "Vertical Collection Method",
    permit_data.permit_ids      "Location Groups",
    emslocn.elevation           "Elevation",
    (
        CASE
            WHEN emslocn.elevation IS NOT NULL THEN
                ( 'metre' )
            WHEN emslocn.elevation IS NULL THEN
                ( NULL )
        END
    )                           "Elevation Unit",
    NULL                        "Standards",
    emslocn.closed_date         "EA_Closed Date",
    emslocn.when_created        "EA_EMS When Created",
    emslocn.when_updated        "EA_EMS When Updated",
    ( 'Created by '
      || staffs.first_name
      || ' '
      || staffs.last_name
      || ' from '
      || clientlocns.short_name
      || ' '
      || clientlocns.name )       "EA_EMS Who Created",
    (
        CASE
            WHEN emslocn.who_updated IS NOT NULL THEN
                ( 'Updated by '
                  || staffs2.first_name
                  || ' '
                  || staffs2.last_name
                  || ' from '
                  || clientlocns2.short_name
                  || ' '
                  || clientlocns2.name )
            WHEN emslocn.who_updated IS NULL THEN
                ( emslocn.who_updated )
        END
    )                           "EA_EMS Who Updated",
    emslocn.established_date    "EA_Established Date",
    well_tags.well_tag_id       "EA_Well Tag ID"
FROM
         b
    INNER JOIN ems_monitoring_locations         emslocn ON b."Locn_ID" = emslocn.id
    INNER JOIN ems_location_types               locn_types ON locn_types.code = emslocn.locntyp_cd
    INNER JOIN ems.ems_enmods_location_type_map locn_typ_map ON locn_typ_map.ems_location_type_code = emslocn.locntyp_cd
    LEFT JOIN ems.well_tag_ids_to_emsid        well_tags ON well_tags.ems_monitoring_location_id = emslocn.id
    LEFT JOIN ems_geo_ref_sources              geo_sources ON geo_sources.code = emslocn.georefsrc_cd
    LEFT JOIN print.staffs                     staffs ON emslocn.who_created = staffs.user_id
    LEFT JOIN ems_client_locations             clientlocns ON emslocn.office_cd = clientlocns.short_name
    LEFT JOIN print.staffs                     staffs2 ON emslocn.who_updated = staffs2.user_id
    LEFT JOIN ems_client_locations             clientlocns2 ON emslocn.office_cd = clientlocns2.short_name
    LEFT JOIN permit_data ON permit_data."Locn_ID" = emslocn.id
WHERE
    emslocn.id IN (
        SELECT
            "Locn_ID"
        FROM
            b
    )
    AND locn_typ_map.enmods_location_type <> 'DO NOT MIGRATE'
ORDER BY
    b."Locn_ID"




-- QUERY 2: Locations between 2006 and 2024 with zero samples
WITH locn_between_2006_2024 AS (
    SELECT
        l.id           "Locn_ID",
        l.when_created "When Created",
        l.when_updated "When Updated"
    FROM
        ems_monitoring_locations l
    WHERE
        l.when_created BETWEEN TO_DATE('2006-01-01', 'YYYY-MM-DD') AND TO_DATE('2024-01-01', 'YYYY-MM-DD')
        OR l.when_updated BETWEEN TO_DATE('2006-01-01', 'YYYY-MM-DD') AND TO_DATE('2024-01-01', 'YYYY-MM-DD')
), between_dates_and_zero_samples AS (
    SELECT
        locn_between_2006_2024."Locn_ID" "Locn_ID",
        locn_between_2006_2024."When Created",
        locn_between_2006_2024."When Updated",
        (
            CASE
                WHEN s.id IS NULL THEN
                    0
            END
        )                                "Samples",
        collection_start_date            "Max_Sample_Date"
    FROM
        locn_between_2006_2024
        LEFT JOIN ems_samples s ON locn_between_2006_2024."Locn_ID" = s.mon_locn_id
    WHERE
        s.mon_locn_id IS NULL
), locn_with_permit_data AS (
    SELECT
        between_dates_and_zero_samples."Locn_ID",
        between_dates_and_zero_samples."When Created",
        between_dates_and_zero_samples."When Updated",
        between_dates_and_zero_samples."Samples",
        between_dates_and_zero_samples."Max_Sample_Date",
        epa.permit_id,
        permit_status.permit_status
    FROM
        between_dates_and_zero_samples
        LEFT JOIN ems_permit_assoc                         epa ON between_dates_and_zero_samples."Locn_ID" = epa.mon_locn_id
        LEFT JOIN ems.ems_etl_permit_status_crosswalk_temp permit_status ON epa.permit_id = permit_status.permit_number
    WHERE
        permit_id IS NOT NULL
    ORDER BY
        between_dates_and_zero_samples."Locn_ID"
), locn_with_collapsed_permits AS (
    SELECT
        locn_with_permit_data."Locn_ID" AS "Locn_ID",
        LISTAGG(locn_with_permit_data.permit_id, '; ') WITHIN GROUP(
        ORDER BY
            locn_with_permit_data.permit_id
        )                               AS permit_ids
    FROM
        locn_with_permit_data
    GROUP BY
        locn_with_permit_data."Locn_ID"
    HAVING
        COUNT(
            CASE
                WHEN permit_status NOT IN('Abandoned', 'Cancelled', 'Expired', 'Withdrawn') THEN
                    1
            END
        ) = 0
)
SELECT
    emslocn.id                             "Location ID",
    emslocn.name                           "Name",
    (
        CASE
            WHEN locn_typ_map.ems_location_type = 'AMBIENT OR BACKGROUND AIR'   THEN
                'Air Quality'
            WHEN locn_typ_map.ems_location_type = 'COMBINED SEWER'              THEN
                'Combined Sewer'
            WHEN locn_typ_map.ems_location_type = 'CONTAMINATED SITE'           THEN
                'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'DITCH OR CULVERT'            THEN
                'Ditch or Culvert'
            WHEN locn_typ_map.ems_location_type = 'ESTUARINE'                   THEN
                'Estuary'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER NON-TREATED'    THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER SOURCE'         THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER TREATED'        THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'IN PLANT'                    THEN
                'In-Plant'
            WHEN locn_typ_map.ems_location_type = 'INFILTRATION POND'           THEN
                'Infiltration Pond'
            WHEN locn_typ_map.ems_location_type = 'IRRIGATION SPRAY/SLUDGE'     THEN
                'Irrigation Spray/Sludge'
            WHEN locn_typ_map.ems_location_type = 'LAKE OR POND'                THEN
                'Lake or Pond'
            WHEN locn_typ_map.ems_location_type = 'LAND - FARM'                 THEN
                'Land - Farm'
            WHEN locn_typ_map.ems_location_type = 'LANDFILL'                    THEN
                'Landfill'
            WHEN locn_typ_map.ems_location_type = 'MARINE'                      THEN
                'Marine'
            WHEN locn_typ_map.ems_location_type = 'MONITORING WELL'             THEN
                'Well'
            WHEN locn_typ_map.ems_location_type = 'OPEN BURNING'                THEN
                'Open Burning'
            WHEN locn_typ_map.ems_location_type = 'OUTFALL'                     THEN
                'Outfall'
            WHEN locn_typ_map.ems_location_type = 'PROVINCIAL OBS WELL NETWORK' THEN
                'Well'
            WHEN locn_typ_map.ems_location_type = 'RIVER,STREAM OR CREEK'       THEN
                'River, Stream, or Creek'
            WHEN locn_typ_map.ems_location_type = 'SEEPAGE OR SEEPAGE POOLS'    THEN
                'Seepage or Seepage Pools'
            WHEN locn_typ_map.ems_location_type = 'SEPTIC TANK'                 THEN
                'Septic Tank'
            WHEN locn_typ_map.ems_location_type = 'SNOW PACK'                   THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SPRING OR HOT SPRING'        THEN
                'Spring or Hot Spring'
            WHEN locn_typ_map.ems_location_type = 'STACK'                       THEN
                'Stack'
            WHEN locn_typ_map.ems_location_type = 'STORAGE'                     THEN
                'Storage'
            WHEN locn_typ_map.ems_location_type = 'STORMSEWER'                  THEN
                'Storm Sewer'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER NON-TREATED'   THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER SOURCE'        THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER TREATED'       THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'TERRESTRIAL'                 THEN
                'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'TILE FIELD'                  THEN
                'Tile Field'
            WHEN locn_typ_map.ems_location_type = 'WELL (LEGACY)'               THEN
                'Well'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB COMMERCIAL'          THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB PUBLIC'              THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL COMMERCIAL'             THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL PUBLIC'                 THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED NON-TREATED'        THEN
                'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED TREATED'            THEN
                'DO NOT MIGRATE'
        END
    )                                      "Type",
    (
        CASE
            WHEN emslocn.mon_locn_comment IS NOT NULL THEN
                replace(replace((emslocn.description
                                 || ' Comments: '
                                 || emslocn.mon_locn_comment),
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
            WHEN emslocn.mon_locn_comment IS NULL THEN
                replace(replace(emslocn.description,
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
        END
    )                                      "Comment",
    NULL                                   "Country",
    NULL                                   "State",
    NULL                                   "County",
    emslocn.latitude                       "Latitude",
    ( - 1 * emslocn.longitude )            "Longitude",
    NULL                                   "Horizontal Datum",
    geo_sources.description                "Horizontal Collection Method",
    NULL                                   "Vertical Datum",
    NULL                                   "Vertical Collection Method",
    locn_with_collapsed_permits.permit_ids "Location Groups",
    emslocn.elevation                      "Elevation",
    (
        CASE
            WHEN emslocn.elevation IS NOT NULL THEN
                ( 'metre' )
            WHEN emslocn.elevation IS NULL THEN
                ( NULL )
        END
    )                                      "Elevation Unit",
    NULL                                   "Standards",
    emslocn.closed_date                    "EA_Closed Date",
    emslocn.when_created                   "EA_EMS When Created",
    emslocn.when_updated                   "EA_EMS When Updated",
    ( 'Created by '
      || staffs.first_name
      || ' '
      || staffs.last_name
      || ' from '
      || clientlocns.short_name
      || ' '
      || clientlocns.name )                  "EA_EMS Who Created",
    (
        CASE
            WHEN emslocn.who_updated IS NOT NULL THEN
                ( 'Updated by '
                  || staffs2.first_name
                  || ' '
                  || staffs2.last_name
                  || ' from '
                  || clientlocns2.short_name
                  || ' '
                  || clientlocns2.name )
            WHEN emslocn.who_updated IS NULL THEN
                ( emslocn.who_updated )
        END
    )                                      "EA_EMS Who Updated",
    emslocn.established_date               "EA_Established Date",
    well_tags.well_tag_id                  "EA_Well Tag ID"
FROM
         locn_with_collapsed_permits
    INNER JOIN ems_monitoring_locations         emslocn ON locn_with_collapsed_permits."Locn_ID" = emslocn.id
    INNER JOIN ems.ems_enmods_location_type_map locn_typ_map ON locn_typ_map.ems_location_type_code = emslocn.locntyp_cd
    LEFT JOIN ems.well_tag_ids_to_emsid        well_tags ON well_tags.ems_monitoring_location_id = emslocn.id
    LEFT JOIN ems_geo_ref_sources              geo_sources ON geo_sources.code = emslocn.georefsrc_cd
    LEFT JOIN print.staffs                     staffs ON emslocn.who_created = staffs.user_id
    LEFT JOIN ems_client_locations             clientlocns ON emslocn.office_cd = clientlocns.short_name
    LEFT JOIN print.staffs                     staffs2 ON emslocn.who_updated = staffs2.user_id
    LEFT JOIN ems_client_locations             clientlocns2 ON emslocn.office_cd = clientlocns2.short_name
WHERE 
    locn_typ_map.enmods_location_type <> 'DO NOT MIGRATE'
ORDER BY
    "Location ID"


-- QUERY 3: Locations with zero samples before 2006 which are active and suspended
WITH locn_before_2006 AS (
    SELECT
        l.id           "Locn_ID",
        l.when_created "When Created",
        l.when_updated "When Updated",
        greatest(l.when_created, l.when_updated) as "max_date"
    FROM
        ems_monitoring_locations l
    WHERE
         greatest(l.when_created, l.when_updated) < TO_DATE('2006-01-01', 'YYYY-MM-DD')
), before_2006_and_zero_samples AS (
    SELECT
        locn_before_2006."Locn_ID" "Locn_ID",
        locn_before_2006."When Created",
        locn_before_2006."When Updated",
        (
            CASE
                WHEN s.id IS NULL THEN
                    0
            END
        )                          "Samples",
        collection_start_date      "Max_Sample_Date"
    FROM
        locn_before_2006
        LEFT JOIN ems_samples s ON locn_before_2006."Locn_ID" = s.mon_locn_id
    WHERE
        s.mon_locn_id IS NULL
), locn_with_permit_data AS (
    SELECT
        before_2006_and_zero_samples."Locn_ID",
        before_2006_and_zero_samples."When Created",
        before_2006_and_zero_samples."When Updated",
        before_2006_and_zero_samples."Samples",
        before_2006_and_zero_samples."Max_Sample_Date",
        epa.permit_id,
        permit_status.permit_status
    FROM
        before_2006_and_zero_samples
        LEFT JOIN ems_permit_assoc                         epa ON before_2006_and_zero_samples."Locn_ID" = epa.mon_locn_id
        LEFT JOIN ems.ems_etl_permit_status_crosswalk_temp permit_status ON epa.permit_id = permit_status.permit_number
    WHERE
        permit_status = 'Active'
        OR permit_status = 'Suspended'
    ORDER BY
        before_2006_and_zero_samples."Locn_ID"
), locn_with_collapsed_permits AS (
    SELECT
        locn_with_permit_data."Locn_ID" AS "Locn_ID",
        LISTAGG(locn_with_permit_data.permit_id, '; ') WITHIN GROUP(
        ORDER BY
            locn_with_permit_data.permit_id
        )                               AS permit_ids
    FROM
        locn_with_permit_data
    WHERE
        locn_with_permit_data."Locn_ID" IN (
            SELECT DISTINCT
                "Locn_ID"
            FROM
                locn_with_permit_data
            WHERE
                permit_status = 'Active'
                OR permit_status = 'Suspended'
        )
    GROUP BY
        locn_with_permit_data."Locn_ID"
)
SELECT
    emslocn.id                  "Location ID",
    emslocn.name                "Name",
    (
        CASE
            WHEN locn_typ_map.ems_location_type = 'AMBIENT OR BACKGROUND AIR' THEN 'Air Quality'
            WHEN locn_typ_map.ems_location_type = 'COMBINED SEWER' THEN 'Combined Sewer'
            WHEN locn_typ_map.ems_location_type = 'CONTAMINATED SITE' THEN 'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'DITCH OR CULVERT'	THEN 'Ditch or Culvert'
            WHEN locn_typ_map.ems_location_type = 'ESTUARINE' THEN 'Estuary'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER SOURCE'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'GROUND WATER TREATED'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'IN PLANT'	THEN 'In-Plant'
            WHEN locn_typ_map.ems_location_type = 'INFILTRATION POND' THEN 'Infiltration Pond'
            WHEN locn_typ_map.ems_location_type = 'IRRIGATION SPRAY/SLUDGE' THEN 'Irrigation Spray/Sludge'
            WHEN locn_typ_map.ems_location_type = 'LAKE OR POND' THEN 'Lake or Pond'
            WHEN locn_typ_map.ems_location_type = 'LAND - FARM' THEN 'Land - Farm'
            WHEN locn_typ_map.ems_location_type = 'LANDFILL'	THEN 'Landfill'
            WHEN locn_typ_map.ems_location_type = 'MARINE' THEN 'Marine'
            WHEN locn_typ_map.ems_location_type = 'MONITORING WELL' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'OPEN BURNING' THEN 'Open Burning'
            WHEN locn_typ_map.ems_location_type = 'OUTFALL' THEN 'Outfall'
            WHEN locn_typ_map.ems_location_type = 'PROVINCIAL OBS WELL NETWORK' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'RIVER,STREAM OR CREEK' THEN 'River, Stream, or Creek'
            WHEN locn_typ_map.ems_location_type = 'SEEPAGE OR SEEPAGE POOLS'	THEN 'Seepage or Seepage Pools'
            WHEN locn_typ_map.ems_location_type = 'SEPTIC TANK' THEN 'Septic Tank'
            WHEN locn_typ_map.ems_location_type = 'SNOW PACK' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SPRING OR HOT SPRING'	THEN 'Spring or Hot Spring'
            WHEN locn_typ_map.ems_location_type = 'STACK' THEN 'Stack'
            WHEN locn_typ_map.ems_location_type = 'STORAGE' THEN 'Storage'
            WHEN locn_typ_map.ems_location_type = 'STORMSEWER' THEN 'Storm Sewer'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER SOURCE'	THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'SURFACE WATER TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'TERRESTRIAL' THEN 'Terrestrial'
            WHEN locn_typ_map.ems_location_type = 'TILE FIELD' THEN 'Tile Field'
            WHEN locn_typ_map.ems_location_type = 'WELL (LEGACY)' THEN 'Well'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB COMMERCIAL' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'HOT TUB PUBLIC' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL COMMERCIAL' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'POOL PUBLIC' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED NON-TREATED' THEN 'DO NOT MIGRATE'
            WHEN locn_typ_map.ems_location_type = 'COMBINED TREATED' THEN 'DO NOT MIGRATE'
        END
    )                           "Type",
    (
        CASE
            WHEN emslocn.mon_locn_comment IS NOT NULL THEN
                replace(replace((emslocn.description
                                 || ' Comments: '
                                 || emslocn.mon_locn_comment),
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
            WHEN emslocn.mon_locn_comment IS NULL THEN
                replace(replace(emslocn.description,
                                CHR(10),
                                ''),
                        CHR(13),
                        '')
        END
    )                           "Comment",
    NULL                        "Country",
    NULL                        "State",
    NULL                        "County",
    emslocn.latitude            "Latitude",
    ( - 1 * emslocn.longitude ) "Longitude",
    NULL                        "Horizontal Datum",
    geo_sources.description     "Horizontal Collection Method",
    NULL                        "Vertical Datum",
    NULL                        "Vertical Collection Method",
    locn_with_collapsed_permits.permit_ids      "Location Groups",
    emslocn.elevation           "Elevation",
    (
        CASE
            WHEN emslocn.elevation IS NOT NULL THEN
                ( 'metre' )
            WHEN emslocn.elevation IS NULL THEN
                ( NULL )
        END
    )                           "Elevation Unit",
    NULL                        "Standards",
    emslocn.closed_date         "EA_Closed Date",
    emslocn.when_created        "EA_EMS When Created",
    emslocn.when_updated        "EA_EMS When Updated",
    ( 'Created by '
      || staffs.first_name
      || ' '
      || staffs.last_name
      || ' from '
      || clientlocns.short_name
      || ' '
      || clientlocns.name )       "EA_EMS Who Created",
    (
        CASE
            WHEN emslocn.who_updated IS NOT NULL THEN
                ( 'Updated by '
                  || staffs2.first_name
                  || ' '
                  || staffs2.last_name
                  || ' from '
                  || clientlocns2.short_name
                  || ' '
                  || clientlocns2.name )
            WHEN emslocn.who_updated IS NULL THEN
                ( emslocn.who_updated )
        END
    )                           "EA_EMS Who Updated",
    emslocn.established_date    "EA_Established Date",
    well_tags.well_tag_id       "EA_Well Tag ID"
FROM
         locn_with_collapsed_permits
    INNER JOIN ems_monitoring_locations         emslocn ON locn_with_collapsed_permits."Locn_ID" = emslocn.id
    INNER JOIN ems.ems_enmods_location_type_map locn_typ_map ON locn_typ_map.ems_location_type_code = emslocn.locntyp_cd
    LEFT JOIN ems.well_tag_ids_to_emsid        well_tags ON well_tags.ems_monitoring_location_id = emslocn.id
    LEFT JOIN ems_geo_ref_sources              geo_sources ON geo_sources.code = emslocn.georefsrc_cd
    LEFT JOIN print.staffs                     staffs ON emslocn.who_created = staffs.user_id
    LEFT JOIN ems_client_locations             clientlocns ON emslocn.office_cd = clientlocns.short_name
    LEFT JOIN print.staffs                     staffs2 ON emslocn.who_updated = staffs2.user_id
    LEFT JOIN ems_client_locations             clientlocns2 ON emslocn.office_cd = clientlocns2.short_name
WHERE 
    locn_typ_map.enmods_location_type <> 'DO NOT MIGRATE'
ORDER BY "Location ID"