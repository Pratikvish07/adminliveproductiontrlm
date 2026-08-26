/* ============================================================================
   URGENT BACKEND FIX — Land Type module (admin_trlm database, SQL Server)
   ----------------------------------------------------------------------------
   SYMPTOM (verified live 2026-08-26):
     Every /api/Land-type/* endpoint returns HTTP 500 with:
       "Could not find stored procedure 'sp_LandType_CRUD'."
     Affected endpoints:
       POST   /api/Land-type/save?id=&name=      (create/update, query params)
       GET    /api/Land-type/get-all
       GET    /api/Land-type/get/{id}
       DELETE /api/Land-type/delete/{id}
       GET    /api/Land-type/search?text=

   ACTION FOR THE BACKEND/DBA TEAM:
     Run this script against the admin_trlm database.
     NOTE: The C# controller's exact SP invocation signature is unknown from
     the frontend. If your data-access layer uses different parameter names
     (e.g. @Operation instead of @Action, or @LandTypeId instead of @Id),
     rename the parameters below to match — or simply copy an existing
     WORKING master procedure (e.g. sp_Season_CRUD / sp_CRPType_CRUD /
     sp_UnitOfArea_*), paste it under this name, and adjust table/columns.
     The frontend needs NO changes either way.
   ============================================================================ */

-- 1) Ensure the backing table exists ----------------------------------------
IF OBJECT_ID(N'dbo.LandType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LandType (
        LandTypeId   INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_LandType PRIMARY KEY,
        LandTypeName NVARCHAR(150)     NOT NULL,
        IsActive     BIT               NOT NULL
            CONSTRAINT DF_LandType_IsActive  DEFAULT (1),
        CreatedDate  DATETIME          NOT NULL
            CONSTRAINT DF_LandType_Created   DEFAULT (GETDATE())
    );
END
GO

-- 2) Create the missing stored procedure ------------------------------------
DROP PROCEDURE IF EXISTS dbo.sp_LandType_CRUD;
GO
CREATE PROCEDURE dbo.sp_LandType_CRUD
    @Action VARCHAR(10)   = NULL,   -- GETALL | GET | SAVE | DELETE | SEARCH
    @Id     INT           = NULL,
    @Name   NVARCHAR(150) = NULL,
    @Text   NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Default action when called with no parameters → list all
    IF @Action IS NULL
        SET @Action = CASE WHEN @Id IS NOT NULL THEN 'GET' ELSE 'GETALL' END;

    IF @Action = 'GETALL'
    BEGIN
        SELECT  LandTypeId, LandTypeName, IsActive, CreatedDate
        FROM    dbo.LandType
        ORDER BY LandTypeName;
        RETURN;
    END

    IF @Action = 'SEARCH'
    BEGIN
        SELECT  LandTypeId, LandTypeName, IsActive, CreatedDate
        FROM    dbo.LandType
        WHERE   @Text IS NULL
           OR   LandTypeName LIKE N'%' + @Text + N'%'
        ORDER BY LandTypeName;
        RETURN;
    END

    IF @Action = 'GET'
    BEGIN
        SELECT  LandTypeId, LandTypeName, IsActive, CreatedDate
        FROM    dbo.LandType
        WHERE   LandTypeId = @Id;
        RETURN;
    END

    IF @Action = 'SAVE'
    BEGIN
        IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = N''
        BEGIN
            RAISERROR(N'Name is required.', 16, 1);
            RETURN;
        END

        IF @Id IS NULL OR @Id = 0                     -- INSERT
        BEGIN
            INSERT INTO dbo.LandType (LandTypeName)
            VALUES (LTRIM(RTRIM(@Name)));
            SELECT CAST(SCOPE_IDENTITY() AS INT) AS Id,
                   N'Inserted Successfully' AS Message;
        END
        ELSE                                          -- UPDATE
        BEGIN
            UPDATE dbo.LandType
            SET    LandTypeName = LTRIM(RTRIM(@Name))
            WHERE  LandTypeId = @Id;
            SELECT @Id AS Id, N'Updated Successfully' AS Message;
        END
        RETURN;
    END

    IF @Action = 'DELETE'
    BEGIN
        DELETE FROM dbo.LandType WHERE LandTypeId = @Id;
        SELECT N'Deleted Successfully' AS Message;
        RETURN;
    END
END
GO

-- 3) Verify ------------------------------------------------------------------
-- EXEC dbo.sp_LandType_CRUD @Action = 'GETALL';                 -- expect empty result set, no error
-- EXEC dbo.sp_LandType_CRUD @Action = 'SAVE', @Name = N'Test';  -- expect Id + success message
-- EXEC dbo.sp_LandType_CRUD @Action = 'SEARCH', @Text = N'Test';
-- EXEC dbo.sp_LandType_CRUD @Action = 'DELETE', @Id = <id from SAVE>;
