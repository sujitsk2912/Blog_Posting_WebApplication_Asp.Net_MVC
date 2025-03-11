create database BLOG_POSTER_DB

-------- CREATE UserDetails TABLE FOR REGISTERED USERS ------------------
/*
DROP TABLE IF EXISTS UserLoggedInData;
DROP TABLE IF EXISTS PostComments;
DROP TABLE IF EXISTS postImageContainer;
DROP TABLE IF EXISTS PostUploadContent;
DROP TABLE IF EXISTS UploadPost;
DROP TABLE IF EXISTS UserDetails;
DROP TABLE IF EXISTS PostContent; 

SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    tr.name AS ReferencedTable
FROM 
    sys.foreign_keys AS fk
JOIN 
    sys.tables AS tp ON fk.parent_object_id = tp.object_id
JOIN 
    sys.tables AS tr ON fk.referenced_object_id = tr.object_id
WHERE 
    tr.name = 'UserDetails';  */


-----------------------------------------------------------------------------


CREATE TABLE UserDetails
(
UserID INT PRIMARY KEY IDENTITY(100,1) NOT NULL,
FirstName NVARCHAR(200) NOT NULL,
LastName NVARCHAR(200) NOT NULL,
Username NVARCHAR(200) UNIQUE NOT NULL,
DateOfBirth DATETIME NOT NULL,
Gender VARCHAR(20) NOT NULL,
Mobile NVARCHAR(20) NULL UNIQUE,
Email NVARCHAR(50) NULL UNIQUE,
UserImageURL VARBINARY(MAX) NULL,
CreatedAt DATETIME NOT NULL,
IsActive BIT NOT NULL
);


SELECT * FROM UserDetails


--------------------------------------------------------


--- CREATE UserLoggedInData FOR PASSWORDS OF USERS --------------------

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
    @Username NVARCHAR(50),
    @Password NVARCHAR(MAX)
)
AS
BEGIN
    SELECT US.UserID, US.FirstName, US.LastName, US.Email, US.Mobile, US.Username
    FROM UserDetails AS US
    INNER JOIN UserLoggedInData AS ULG
    ON US.UserID = ULG.UserID
    WHERE (US.Email = @Email OR US.Mobile = @Mobile OR US.Username = @Username)
    AND ULG.Password = @Password;
END;


--------------------------------------------------------------------------


CREATE OR ALTER PROCEDURE sp_InsertUserWithLogin
    @FirstName NVARCHAR(200),
    @LastName NVARCHAR(200),
	@Username NVARCHAR(200),
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
        INSERT INTO UserDetails (FirstName, LastName, Username, DateOfBirth, Gender, Mobile, Email, CreatedAt, IsActive)
        VALUES (@FirstName, @LastName,@Username, @DateOfBirth, @Gender, @Mobile, @Email, GETDATE(), 1);

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
    PostID INT PRIMARY KEY IDENTITY(3000,1) NOT NULL,
    UserID INT NOT NULL,
    PostedOn DATETIME NOT NULL,
    CONSTRAINT FK_UserDetails_Users FOREIGN KEY (UserID)
    REFERENCES UserDetails(UserID) ON DELETE CASCADE ON UPDATE CASCADE
);

--------------------------------------------------------------


CREATE TABLE PostUploadContent
(
    PostID INT PRIMARY KEY NOT NULL,
    UserID INT NOT NULL,
    PostContent NVARCHAR(MAX) NULL,

    -- Ensure PostID exists in UploadPost and cascade delete
    CONSTRAINT FK_PostContents FOREIGN KEY (PostID) 
    REFERENCES UploadPost(PostID) ON DELETE CASCADE,

    -- Ensure UserID exists in UserDetails
    CONSTRAINT FK_PostContent_Users FOREIGN KEY (UserID)
    REFERENCES UserDetails(UserID)
);

--------------------------------------------------------------


CREATE TABLE postImageContainer
(
    PostID INT PRIMARY KEY NOT NULL,
    UserID INT NOT NULL,
    PostImageURL VARBINARY(MAX) NULL,

    -- Ensure PostID exists in UploadPost and cascade delete
    CONSTRAINT FK_ImgContents FOREIGN KEY (PostID) 
    REFERENCES UploadPost(PostID) ON DELETE CASCADE,

    -- Ensure UserID exists in UserDetails
    CONSTRAINT FK_ImgContent_Users FOREIGN KEY (UserID)
    REFERENCES UserDetails(UserID)
);

select * from postImageContainer

delete postImageContainer where PostID = 3019 and UserID = 101

---------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_InsertPostData
    @UserID INT,
    @PostedOn DATETIME,
    @PostContent NVARCHAR(MAX) = NULL,
    @PostImageURL VARBINARY(MAX) = NULL
AS
BEGIN
    -- Declare a variable to store the newly generated PostID
    DECLARE @NewPostID INT;

    -- Start a transaction to ensure atomicity
    BEGIN TRANSACTION;

    -- Insert into UploadPost table
    INSERT INTO UploadPost (UserID, PostedOn)
    VALUES (@UserID, @PostedOn);

    -- Get the newly generated PostID
    SET @NewPostID = SCOPE_IDENTITY();

    -- Insert into PostUploadContent table
    INSERT INTO PostUploadContent (PostID, UserID, PostContent)
    VALUES (@NewPostID, @UserID, @PostContent);

    -- Insert into postImageContainer table
    INSERT INTO postImageContainer (PostID, UserID, PostImageURL)
    VALUES (@NewPostID, @UserID, @PostImageURL);

    -- Commit the transaction
    COMMIT TRANSACTION;
END;


---------------------------------------------------------------------

SELECT * FROM UploadPost
SELECT * FROM PostUploadContent
SELECT * FROM postImageContainer


delete UploadPost where PostID in (3014,3015,3016,3018) and UserID In (101)
----------------------------------------------

CREATE OR ALTER PROCEDURE usp_GetPosts
AS
BEGIN
    SELECT 
        UD.FirstName,
        UD.LastName,
        UD.Username,
        UD.UserImageURL,
        UP.PostID,
        UP.UserID,
        UP.PostedOn,
        PUC.PostContent,
        PIC.PostImageURL
    FROM 
        UploadPost UP
    LEFT JOIN 
        UserDetails UD ON UD.UserID = UP.UserID
    LEFT JOIN 
        PostUploadContent PUC ON UP.PostID = PUC.PostID
    LEFT JOIN 
        postImageContainer PIC ON UP.PostID = PIC.PostID
    ORDER BY 
        UP.PostedOn DESC; -- Order by most recent posts first
END;


-----------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_EditPost
    @UserID INT,
    @PostID INT,
    @PostContent NVARCHAR(MAX),
    @PostImageURL VARBINARY(MAX)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Ensure the post exists and belongs to the correct user
        IF NOT EXISTS (SELECT 1 FROM UploadPost WHERE PostID = @PostID AND UserID = @UserID)
        BEGIN
            THROW 50001, 'Unauthorized: User cannot edit this post.', 1;
        END;

        -- Update PostUploadContent table (Edit the post content)
        UPDATE PostUploadContent
        SET PostContent = @PostContent
        WHERE PostID = @PostID;

        -- Update postImageContainer table (If the image exists, update; otherwise, insert a new one)
        IF EXISTS (SELECT 1 FROM postImageContainer WHERE PostID = @PostID)
        BEGIN
            UPDATE postImageContainer
            SET PostImageURL = @PostImageURL
            WHERE PostID = @PostID;
        END
        ELSE
        BEGIN
            INSERT INTO postImageContainer (PostID, PostImageURL)
            VALUES (@PostID, @PostImageURL);
        END;

        COMMIT TRANSACTION;
        SELECT 'Post updated successfully' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END;



-----------------------------------------------------------------

SELECT * FROM PostComments
SELECT * FROM UploadPost

------------------------------------------------------

CREATE TABLE PostComments
(
    CommentID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    CommentText NVARCHAR(MAX) NOT NULL,
    CommentedOn DATETIME NOT NULL DEFAULT GETDATE(),
    
    -- Foreign key constraints without cascade
    CONSTRAINT FK_PostComments_UploadPost FOREIGN KEY (PostID)
        REFERENCES UploadPost(PostID) ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_PostComments_UserDetails FOREIGN KEY (UserID)
        REFERENCES UserDetails(UserID) ON DELETE NO ACTION ON UPDATE NO ACTION
);

---------------------------------------

-- DELETE COMMENTS WHEN USER IS DELETED ---------

CREATE OR ALTER TRIGGER trg_DeleteUserComments
ON UserDetails
AFTER DELETE
AS
BEGIN
    DELETE FROM PostComments
    WHERE UserID IN (SELECT UserID FROM deleted);
END;


-------------------------------------------------
----     -- Update UserID in PostComments when UserID is updated in UserDetails ------------

CREATE OR ALTER TRIGGER trg_UpdateUserComments
ON UserDetails
AFTER UPDATE
AS
BEGIN
    UPDATE pc
    SET pc.UserID = i.UserID
    FROM PostComments pc
    INNER JOIN deleted d ON pc.UserID = d.UserID
    INNER JOIN inserted i ON d.UserID = i.UserID;
END;


-------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_PostComments
    @PostID INT,                -- Input: PostID
    @UserID INT,                -- Input: UserID
    @CommentText NVARCHAR(MAX)  -- Input: Comment Text
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate if PostID and UserID exist
    IF NOT EXISTS (SELECT 1 FROM UploadPost WHERE PostID = @PostID)
    BEGIN
        RETURN 0; -- Post does not exist
    END

    IF NOT EXISTS (SELECT 1 FROM UserDetails WHERE UserID = @UserID)
    BEGIN
        RETURN 0; -- User does not exist
    END

    -- Insert comment into PostComments table
    INSERT INTO PostComments (PostID, UserID, CommentText)
    VALUES (@PostID, @UserID, @CommentText);

    RETURN 1; -- Success
END;

----------------------------------------------------------------------

select * from PostComments where PostID = 4084

-------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_getCommentsByPost
    @PostID INT,         -- Input parameter: PostID (required)
    @UserID INT = NULL   -- Input parameter: UserID (optional)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if the post exists
    IF NOT EXISTS (SELECT 1 FROM UploadPost WHERE PostID = @PostID)
    BEGIN
        RETURN 0; -- Post does not exist
    END

    -- Fetch comments for the given PostID and optionally filter by UserID
    SELECT 
        PC.CommentID,
        PC.PostID,
        PC.UserID,
        PC.CommentText,
        PC.CommentedOn,
        UD.FirstName,
        UD.LastName,
        UD.UserImageURL
    FROM 
        PostComments PC
    INNER JOIN 
        UserDetails UD ON PC.UserID = UD.UserID
    WHERE 
        PC.PostID = @PostID
    ORDER BY 
        PC.CommentedOn DESC; -- Latest comments first

    RETURN 1; -- Success
END;


---------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_DeleteCommentOnPost
    @UserID INT,       -- User who wants to delete the comment
    @PostID INT,       -- Post from which the comment will be deleted
    @CommentID INT     -- Specific comment to be deleted
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if the comment exists and belongs to the user for the given post
    IF NOT EXISTS (
        SELECT 1 
        FROM PostComments 
        WHERE CommentID = @CommentID 
          AND PostID = @PostID 
          AND UserID = @UserID
    )
    BEGIN
        PRINT 'Comment not found or unauthorized access';
        RETURN 0; -- Failure: Comment not found or not authorized
    END

    -- Delete the comment
    DELETE FROM PostComments
    WHERE CommentID = @CommentID 
      AND PostID = @PostID 
      AND UserID = @UserID;

    PRINT 'Comment deleted successfully';
    RETURN 1; -- Success
END;

----------------------------------------------------------------------------

CREATE TABLE PostLikes (
    LikeID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    PostID INT NOT NULL,
    LikedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PostLikes_User FOREIGN KEY (UserID) REFERENCES UserDetails(UserID),
    CONSTRAINT FK_PostLikes_Post FOREIGN KEY (PostID) REFERENCES UploadPost(PostID),
    UNIQUE (UserID, PostID) -- Prevent duplicate likes
);


DROP TABLE PostLikes

--------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_ToggleLikeOnPost
    @UserID INT,      -- User who is liking or unliking the post
    @PostID INT       -- Post to be liked or unliked
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if the like already exists
    IF EXISTS (
        SELECT 1 
        FROM PostLikes 
        WHERE UserID = @UserID 
          AND PostID = @PostID
    )
    BEGIN
        -- If like exists, remove it (Unlike the post)
        DELETE FROM PostLikes 
        WHERE UserID = @UserID 
          AND PostID = @PostID;

        PRINT 'Like removed successfully';
    END
    ELSE
    BEGIN
        -- If like doesn't exist, add it (Like the post)
        INSERT INTO PostLikes (UserID, PostID, LikedAt)
        VALUES (@UserID, @PostID, GETDATE());

        PRINT 'Like added successfully';
    END

    -- Return the updated like count for the post
    SELECT COUNT(*) AS TotalLikes 
    FROM PostLikes 
    WHERE PostID = @PostID;
END;

-------------------------------------------------------

-- UserProfile Table (Related Table)
CREATE TABLE UserProfile
(
    ProfileID INT PRIMARY KEY IDENTITY(1,1),             
    UserID INT NOT NULL,                                  
    BioData NVARCHAR(MAX) NULL,                           
    Followers INT DEFAULT 0,                              
    Following INT DEFAULT 0,                              
    PostsCount INT DEFAULT 0,                              
    Website NVARCHAR(200) NULL,                           
    Location NVARCHAR(200) NULL,                          
    SocialLinks NVARCHAR(MAX) NULL,                       
    LastLogin DATETIME NULL,                              
    UpdatedAt DATETIME DEFAULT GETDATE(),                 
    FOREIGN KEY (UserID) REFERENCES UserDetails(UserID) 
    ON DELETE CASCADE                                     
);


select * from UserProfile where UserID = 104

--------------------------------------------------------

CREATE OR ALTER TRIGGER trg_UpdatePostsCount
ON UploadPost
AFTER INSERT, DELETE
AS
BEGIN
    UPDATE UserProfile
    SET PostsCount = (
        SELECT COUNT(*) 
        FROM UploadPost 
        WHERE UploadPost.UserID = UserProfile.UserID
    )
    WHERE UserID IN (
        SELECT UserID FROM inserted 
        UNION 
        SELECT UserID FROM deleted
    );
END;

----------------------------------------------------

CREATE OR ALTER TRIGGER trg_InsertUserProfile
ON UserDetails
AFTER INSERT
AS
BEGIN
    INSERT INTO UserProfile (UserID, BioData, Followers, Following, PostsCount, Website, Location, SocialLinks, LastLogin, UpdatedAt)
    SELECT UserID, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, GETDATE()
    FROM inserted;
END;
------------------------------------------------------------------------------------------------

SELECT * FROM UserProfile 
SELECT * FROM UploadPost
SELECT * FROM UserDetails


SELECT * FROM UserDetails WHERE UserID = 104;

SELECT * FROM UserProfile WHERE UserID = 104;


------------------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_GetUserProfileByID
    @UserID INT
AS
BEGIN
    SELECT 
        UD.UserID, 
        UD.FirstName, 
        UD.LastName, 
        UD.Username, 
        UD.Username, 
        UD.DateOfBirth, 
        UD.Gender, 
        UD.Mobile, 
        UD.Email, 
        UD.UserImageURL, 
        UD.CreatedAt, 
        UD.IsActive,
        UP.BioData, 
        UP.Followers, 
        UP.Following, 
        UP.PostsCount
    FROM UserDetails UD
    LEFT JOIN UserProfile UP ON UD.UserID = UP.UserID
    WHERE UD.UserID = @UserID;
END;

exec  usp_GetUserProfileByID @UserID = 104


---------------------------------------------------------------------

CREATE OR ALTER PROCEDURE usp_SearchUserByName
    @SearchTerm NVARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;

    -- Trim leading/trailing spaces from the search term
    SET @SearchTerm = LTRIM(RTRIM(@SearchTerm));

    -- Search for records where FirstName or LastName contains the search term
    SELECT UserID, FirstName, LastName, Username, UserImageURL
    FROM UserDetails
    WHERE FirstName LIKE '%' + @SearchTerm + '%'
       OR LastName LIKE '%' + @SearchTerm + '%'
       OR Username LIKE '%' + @SearchTerm + '%';
END;

exec usp_SearchUserByName  @SearchTerm = 'v'
-------------------------------------
