using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Infrastructure;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Services.Description;
using System.Web.UI.WebControls;

namespace Blog_Posting_WebApplication.Controllers.UploadPost
{
    public class UploadPostController : Controller
    {
        static SqlConnection conn = DbConnection.GetConnection();
        static SqlDataAdapter adapter;
        static DataTable dt;


        [HttpGet]
        public ActionResult UploadPost()
        {
            if (Session["UserID"] == null)
            {
                return RedirectToAction("Login", "Account");
            }
            return View();
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult UploadPost(string postContent, HttpPostedFileBase imageFile)
        {
            try
            {
                conn.Open();

                // Check if the user is logged in
                if (Session["UserID"] == null)
                {
                    return Json(new { success = false, message = "User not logged in! Please login first...", redirectTo = Url.Action("Login", "Account") }, JsonRequestBehavior.AllowGet);
                }

                int userId = Convert.ToInt32(Session["UserID"]);
                string imageUrl = null;

                // Save the uploaded image to PostAssets/images folder
                if (imageFile != null && imageFile.ContentLength > 0)
                {
                    try
                    {
                        // Resolve the physical path to the PostAssets/images folder
                        var imagesFolder = Server.MapPath("~/PostAssets/images");
                        System.Diagnostics.Debug.WriteLine("Resolved Images Folder Path: " + imagesFolder);

                        // Ensure the folder exists
                        if (!Directory.Exists(imagesFolder))
                        {
                            Directory.CreateDirectory(imagesFolder);
                            System.Diagnostics.Debug.WriteLine("Created Images Folder: " + imagesFolder);
                        }

                        // Generate a unique file name
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                        var filePath = Path.Combine(imagesFolder, fileName);
                        System.Diagnostics.Debug.WriteLine("Resolved File Path: " + filePath);

                        // Save the file to the PostAssets/images folder
                        imageFile.SaveAs(filePath);
                        System.Diagnostics.Debug.WriteLine("File Saved Successfully: " + filePath);

                        // Set the image URL for the database
                        imageUrl = fileName;
                        System.Diagnostics.Debug.WriteLine("Image URL: " + imageUrl);
                    }
                    catch (Exception ex)
                    {
                        // Log the exception for debugging
                        System.Diagnostics.Debug.WriteLine("Error saving file: " + ex.Message);
                        return Json(new { success = false, message = "Error saving file: " + ex.Message }, JsonRequestBehavior.AllowGet);
                    }
                }

                // Insert post data into the database
                SqlCommand cmdUploadPost = new SqlCommand("usp_InsertPostData", conn);
                cmdUploadPost.CommandType = CommandType.StoredProcedure;
                cmdUploadPost.Parameters.AddWithValue("@UserID", userId);
                cmdUploadPost.Parameters.AddWithValue("@PostedOn", DateTime.Now);
                cmdUploadPost.Parameters.AddWithValue("@PostContent", postContent ?? (object)DBNull.Value);
                cmdUploadPost.Parameters.AddWithValue("@imgURL", imageUrl ?? (object)DBNull.Value); // Use DBNull.Value if no image is uploaded

                cmdUploadPost.ExecuteNonQuery();

                return Json(new { success = true }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
            finally
            {
                conn.Close();
            }
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public JsonResult DeletePost(int userId, int postId)
        {
            try
            {
                conn.Open();
                using (SqlCommand cmdDeletePost = new SqlCommand("usp_DeletePost", conn))
                {
                    cmdDeletePost.CommandType = CommandType.StoredProcedure;
                    cmdDeletePost.Parameters.AddWithValue("@UserID", userId);
                    cmdDeletePost.Parameters.AddWithValue("@PostID", postId);
                    int rowsAffected = cmdDeletePost.ExecuteNonQuery();

                    if (rowsAffected > 0)
                    {
                        return Json(new { success = true, message = "Post deleted successfully." });
                    }
                    return Json(new { success = false, message = "Post not found or already deleted." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
            finally
            {
                conn.Close();
            }
        }


        [HttpPost]
        public JsonResult AddCommentOnPost(int userId, int postId, string PostComment)
        {
            try
            {
                // Ensure the connection is opened
                conn.Open();

                SqlCommand cmdPostComment = new SqlCommand("usp_PostComments", conn);

                cmdPostComment.CommandType = CommandType.StoredProcedure;

                // Add parameters
                cmdPostComment.Parameters.AddWithValue("@UserID", userId);
                cmdPostComment.Parameters.AddWithValue("@PostID", postId);
                cmdPostComment.Parameters.AddWithValue("@CommentText", PostComment);

                // Execute the stored procedure
                int rowsAffected = cmdPostComment.ExecuteNonQuery();

                // Check if the comment was inserted successfully
                if (rowsAffected > 0)
                {
                    return Json(new { success = true, message = "Commented on post successfully." });
                }
                else
                {
                    return Json(new { success = false, message = "Failed to add comment. Post or user may not exist." });
                }
            }
            catch (Exception ex)
            {
                // Log the exception (optional) and return an error message
                // Log.Error("Error adding comment: " + ex.Message);
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
            finally
            {
                conn.Close();
            }
        }
    }
}
