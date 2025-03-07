create database BLOG_POSTER_DB

-------- CREATE UserDetails TABLE FOR REGISTERED USERS ------------------

DROP TABLE UserDetails

truncate TABLE UserDetails

CREATE TABLE UserDetails
(
UserID INT PRIMARY KEY IDENTITY(100,1) NOT NULL,
FirstName NVARCHAR(200) NOT NULL,
LastName NVARCHAR(200) NOT NULL,
DateOfBirth DATETIME NOT NULL,
Gender VARCHAR(20) NOT NULL,
Mobile NVARCHAR(20) NULL UNIQUE,
Email NVARCHAR(50) NULL UNIQUE,
CreatedAt DATETIME NOT NULL,
IsActive BIT NOT NULL
);

--------------------------------------------------------


--- CREATE UserLoggedInData FOR PASSWORDS OF USERS --------------------

truncate TABLE UserLoggedInData

CREATE TABLE UserLoggedInData
(
    UserID INT NOT NULL PRIMARY KEY,
    Password NVARCHAR(MAX) NOT NULL,
    LoggedInAt DATETIME NOT NULL,
    UpdatedAt DATETIME NULL,
   CONSTRAINT FK_UserLoggedInData_User FOREIGN KEY (UserID)
	REFERENCES UserDetails(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);


--------------------------------------------------------

SELECT * FROM UserDetails
SELECT * FROM UserLoggedInData



---------------------------------------------------------------------


CREATE OR ALTER PROCEDURE sp_CheckUserExists
(
@Email NVARCHAR(50),
@Mobile NVARCHAR(20)
)
AS
BEGIN
 SELECT COUNT(*) FROM UserDetails
WHERE Email= @Email OR Mobile = @Mobile 
END;

-----------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE sp_CheckUserLogin
(
    @Email NVARCHAR(50),
    @Mobile NVARCHAR(20),
    @Password NVARCHAR(MAX)
)
AS
BEGIN
    SELECT US.UserID, US.FirstName, US.LastName, US.Email, US.Mobile
    FROM UserDetails AS US
    INNER JOIN UserLoggedInData AS ULG
    ON US.UserID = ULG.UserID
    WHERE (US.Email = @Email OR US.Mobile = @Mobile)
    AND ULG.Password = @Password;
END;


--------------------------------------------------------------------------


CREATE PROCEDURE sp_InsertUserWithLogin
    @FirstName NVARCHAR(200),
    @LastName NVARCHAR(200),
    @DateOfBirth DATETIME,
    @Gender VARCHAR(20),
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(50) = NULL,
    @Password NVARCHAR(MAX)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert data into UserDetails and capture the generated UserID
        INSERT INTO UserDetails (FirstName, LastName, DateOfBirth, Gender, Mobile, Email, CreatedAt, IsActive)
        VALUES (@FirstName, @LastName, @DateOfBirth, @Gender, @Mobile, @Email, GETDATE(), 1);

        DECLARE @NewUserID INT = SCOPE_IDENTITY();

        -- Insert data into UserLoggedInData using the new UserID
        INSERT INTO UserLoggedInData (UserID, Password, LoggedInAt, UpdatedAt)
        VALUES (@NewUserID, @Password, GETDATE(), NULL);

        COMMIT TRANSACTION;
        PRINT 'Data inserted successfully';
    END TRY

    BEGIN CATCH
        -- Handle errors
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        PRINT 'Error: ' + ERROR_MESSAGE();
        THROW; -- Re-throw the error for higher-level handling
    END CATCH
END;



----------------------------------------------------------------

CREATE TABLE UploadPost
(
PostID INT PRIMARY KEY IDENTITY(3000,1) NOT NULL ,
UserID INT NOT NULL,
PostedOn DATETIME NOT NULL,
CommentsID INT NULL,
LikesID INT NULL,
	CONSTRAINT FK_UserDetails_Users FOREIGN KEY (UserID)
	REFERENCES UserDetails(UserID)
);


--------------------------------------------------------------

CREATE TABLE PostUploadContent
(
    PostID INT PRIMARY KEY NOT NULL,
    UserID INT NOT NULL,
    PostContent NVARCHAR(MAX) NOT NULL,

    -- Ensure PostID exists in PostUploadTB
    CONSTRAINT FK_PostContents FOREIGN KEY (PostID) 
    REFERENCES UploadPost(PostID),

    -- Ensure UserID exists in UserDetails
    CONSTRAINT FK_PostContent_Users FOREIGN KEY (UserID)
    REFERENCES UserDetails(UserID)
);

--------------------------------------------------------------

SELECT * FROM UploadPost
SELECT * FROM PostUploadContent
SELECT * FROM postImageContainer

-------------------------------------------------

CREATE TRIGGER trg_EnsureUserMatch
ON PostContent
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN UploadPost p ON i.PostID = p.PostID
        WHERE i.UserID <> p.UserID
    )
    BEGIN
        RAISERROR('UserID mismatch between PostUpload and PostContent.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;


----------------------------------------------------------

CREATE TABLE postImageContainer
(
	PostID INT PRIMARY KEY NOT NULL,
    UserID INT NOT NULL,
	ImageID INT NOT NULL IDENTITY(1234, 1),
    imgURL NVARCHAR(MAX) NULL,

	 -- Ensure PostID exists in PostUploadTB
    CONSTRAINT FK_ImgContents FOREIGN KEY (PostID) 
    REFERENCES UploadPost(PostID),

    -- Ensure UserID exists in UserDetails
    CONSTRAINT FK_ImgContent_Users FOREIGN KEY (UserID)
    REFERENCES UserDetails(UserID)
)


-----------------------------------------------------------