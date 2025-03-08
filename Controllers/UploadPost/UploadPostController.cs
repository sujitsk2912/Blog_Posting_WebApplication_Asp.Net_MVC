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

                if (Session["UserID"] == null)
                {
                    return Json(new { success = false, message = "User not logged in!", redirectTo = Url.Action("Login", "Account") }, JsonRequestBehavior.AllowGet);
                }

                int userId = Convert.ToInt32(Session["UserID"]);
                string imageUrl = null;

                if (imageFile != null && imageFile.ContentLength > 0)
                {
                    var imagesFolder = Server.MapPath("~/PostAssets/images");
                    if (!Directory.Exists(imagesFolder))
                    {
                        Directory.CreateDirectory(imagesFolder);
                    }

                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                    var filePath = Path.Combine(imagesFolder, fileName);

                    imageFile.SaveAs(filePath);
                    imageUrl = fileName;
                }

                if (postContent != "" || imageFile != null)
                {

                    using (var cmdUploadPost = new SqlCommand("usp_InsertPostData", conn))
                    {
                        cmdUploadPost.CommandType = CommandType.StoredProcedure;
                        cmdUploadPost.Parameters.AddWithValue("@UserID", userId);
                        cmdUploadPost.Parameters.AddWithValue("@PostedOn", DateTime.Now);
                        cmdUploadPost.Parameters.AddWithValue("@PostContent", postContent ?? (object)DBNull.Value);
                        cmdUploadPost.Parameters.AddWithValue("@imgURL", imageUrl ?? (object)DBNull.Value);
                        cmdUploadPost.ExecuteNonQuery();
                    }

                    return Json(new { success = true }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { success = false, message = "Post uploading failed!" }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Content: " + postContent);
                System.Diagnostics.Debug.WriteLine("Image: " + (imageFile != null ? imageFile.FileName : "NULL"));

                System.Diagnostics.Debug.WriteLine("Error: " + ex.Message);
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
