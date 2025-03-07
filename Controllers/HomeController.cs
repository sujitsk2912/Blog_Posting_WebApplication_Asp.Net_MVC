using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blog_Posting_WebApplication.Controllers.Account;

namespace Blog_Posting_WebApplication.Controllers
{
    public class HomeController : Controller
    {
        static SqlConnection conn = DbConnection.GetConnection();
        static SqlDataAdapter adapter;
        static DataTable dt;

        [HttpGet]
        public ActionResult Index()
        {
            // ✅ Get the authenticated user's ID from session or cookie
            int? userId = GetAuthenticatedUserId();

            if (userId == null)
            {
                // ✅ If no user ID is found, redirect to login
                return RedirectToAction("Login", "Account");
            }

            // Get the authenticated user's ID from session
            

            // ✅ Fetch the user's first name and last name
            var (firstName, lastName) = GetUserFirstNameAndLastName(userId.Value);

            // ✅ Handle null or empty values
            if (string.IsNullOrEmpty(firstName))
            {
                firstName = "User"; // Default value
            }
            if (string.IsNullOrEmpty(lastName))
            {
                lastName = ""; // Default value (empty string)
            }

            // ✅ Pass the user's full name to the view
            ViewBag.FirstName = firstName;
            ViewBag.LastName = lastName;

            ViewBag.UserId = userId;
            // ✅ Get posts and return the view
            return View(GetPosts());
        }

        [HttpGet]
        //[AllowAnonymous] // Allow anonymous access to this action
        public JsonResult GetPosts()
        {
            try
            {
                List<object> posts = new List<object>();

                conn.Open();
                SqlCommand cmdGetPosts = new SqlCommand("usp_GetPosts", conn);

                cmdGetPosts.CommandType = CommandType.StoredProcedure;
                SqlDataReader reader = cmdGetPosts.ExecuteReader();

                while (reader.Read())
                {
                    posts.Add(new
                    {
                        PostID = reader["PostID"],
                        UserID = reader["UserID"],
                        FirstName = reader["FirstName"],
                        LastName = reader["LastName"],
                        PostedOn = Convert.ToDateTime(reader["PostedOn"]).ToString("yyyy-MM-ddTHH:mm:ss"),
                        PostContent = reader["PostContent"] == DBNull.Value ? null : reader["PostContent"],
                        imgURL = reader["imgURL"] == DBNull.Value ? null : reader["imgURL"],
                        UserImage = reader["UserImage"] == DBNull.Value ? null : reader["UserImage"]
                    });
                }
                return Json(posts, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error in GetPosts: " + ex.ToString());
                return Json(new { success = false, error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
            finally
            {
                conn.Close();
            }
        }

        [HttpGet]
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";
            return View();
        }

        [HttpGet]
        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";
            return View();
        }

        // ✅ Helper method to get the authenticated user's ID from session or cookie
        private int? GetAuthenticatedUserId()
        {
            // ✅ Check session first
            if (Session["UserID"] != null)
            {
                return Convert.ToInt32(Session["UserID"]);
            }

            // ✅ If session is null, check cookies
            if (Request.Cookies["UserID"] != null && !string.IsNullOrEmpty(Request.Cookies["UserID"].Value))
            {
                // ✅ Restore session from cookie
                int userId;
                if (int.TryParse(Request.Cookies["UserID"].Value, out userId))
                {
                    Session["UserID"] = userId; // Restore session
                    return userId;
                }
            }

            // ✅ If no session or cookie is found, return null
            return null;
        }

        // ✅ Helper method to fetch the user's first name from the database
        // ✅ Helper method to fetch the user's first name and last name from the database
        private (string FirstName, string LastName) GetUserFirstNameAndLastName(int userId)
        {
            string firstName = null;
            string lastName = null;

            try
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SELECT FirstName, LastName FROM UserDetails WHERE UserID = @UserID", conn);
                cmd.Parameters.AddWithValue("@UserID", userId);

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        // Fetch FirstName and LastName from the reader
                        firstName = reader["FirstName"] as string;
                        lastName = reader["LastName"] as string;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Error fetching user details: " + ex.Message);
            }
            finally
            {
                conn.Close();
            }

            return (firstName, lastName);
        }
    }
}