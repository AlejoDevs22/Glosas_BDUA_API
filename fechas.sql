-- ====================================================================
-- CONSULTAS PARA OBTENER LAS FECHAS DE PROCESO (SQL SERVER)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Proceso NS (Tabla: SUB_HISNSNEG)
-- --------------------------------------------------------------------
-- SELECT NSFECHAPROCESO
-- FROM (
--     SELECT DISTINCT
--            NSFECHAPROCESO,
--            CONVERT(DATE, NSFECHAPROCESO, 103) AS Fecha
--     FROM SUB_HISNSNEG
--     WHERE CONVERT(DATE, NSFECHAPROCESO, 103) >= '20260101'
-- ) T
-- ORDER BY Fecha ASC;


-- --------------------------------------------------------------------
-- 2. Proceso NC (Tabla: HISNCNEG)
-- --------------------------------------------------------------------
-- SELECT NCNEGFECHAPROCESO
-- FROM (
--     SELECT DISTINCT
--            NCNEGFECHAPROCESO,
--            CONVERT(DATE, NCNEGFECHAPROCESO, 103) AS Fecha
--     FROM HISNCNEG
--     WHERE CONVERT(DATE, NCNEGFECHAPROCESO, 103) >= '20260101'
-- ) T
-- ORDER BY Fecha ASC;


-- --------------------------------------------------------------------
-- 3. Proceso MC (Tabla: HISMCNEG)
-- --------------------------------------------------------------------
SELECT MCFECHAPROCESO
FROM (
    SELECT DISTINCT
           MCFECHAPROCESO,
           CONVERT(DATE, MCFECHAPROCESO, 103) AS Fecha
    FROM HISMCNEG
    WHERE CONVERT(DATE, MCFECHAPROCESO, 103) >= '20260101'
) T
ORDER BY Fecha ASC;


-- --------------------------------------------------------------------
-- 4. Proceso MS (Tabla: SUB_HISMSNEG)
-- --------------------------------------------------------------------
-- SELECT MSNEGFECHAPROCESO
-- FROM (
--     SELECT DISTINCT
--            MSNEGFECHAPROCESO,
--            CONVERT(DATE, MSNEGFECHAPROCESO, 103) AS Fecha
--     FROM SUB_HISMSNEG
--     WHERE CONVERT(DATE, MSNEGFECHAPROCESO, 103) >= '20260101'
-- ) T
-- ORDER BY Fecha ASC;


-- --------------------------------------------------------------------
-- 5. Proceso R1 (Tabla: HISR3)
-- --------------------------------------------------------------------
-- SELECT R3FECHAPROCESO
-- FROM (
--     SELECT DISTINCT
--            R3FECHAPROCESO,
--            CONVERT(DATE, R3FECHAPROCESO, 103) AS Fecha
--     FROM HISR3
--     WHERE CONVERT(DATE, R3FECHAPROCESO, 103) >= '20260101'
-- ) T
-- ORDER BY Fecha ASC;


-- --------------------------------------------------------------------
-- 6. Proceso S1 (Tabla: SUB_HISS3)
-- --------------------------------------------------------------------
-- SELECT S3FECHAPROCESO
-- FROM (
--     SELECT DISTINCT
--            S3FECHAPROCESO,
--            CONVERT(DATE, S3FECHAPROCESO, 103) AS Fecha
--     FROM SUB_HISS3
--     WHERE CONVERT(DATE, S3FECHAPROCESO, 103) >= '20260101'
-- ) T
-- ORDER BY Fecha ASC;