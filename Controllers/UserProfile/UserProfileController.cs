using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Web.Mvc;

namespace Blog_Posting_WebApplication.Controllers.UserProfile
{
    public class UserProfileController : Controller
    {
        static SqlConnection conn = DbConnection.GetConnection();

        // GET: UserProfile
        [HttpGet]
        public ActionResult ShowUserProfile(int userId)
        {
            try
            {
                var userProfile = GetUserProfile(userId);

                if (userProfile != null)
                {
                    return View(userProfile);
                }
                else
                {
                    ViewBag.ErrorMessage = "User not found.";
                    return View();
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Error: " + ex.Message;
                return View();
            }
        }

        [HttpPost]
        public JsonResult UserProfile(int userId)
        {
            try
            {
                var userProfile = GetUserProfile(userId);

                if (userProfile != null)
                {
                    return Json(new { success = true, user = userProfile });
                }
                else
                {
                    return Json(new { success = false, message = "User not found." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet]
        public ActionResult GetOurProfile()
        {
            // Check if the user is logged in
            if (Session["UserID"] == null)
            {
                // Redirect to the login page if the user is not logged in
                return RedirectToAction("Login", "Account");
            }

            // Get the logged-in user's ID from the session
            int userId = Convert.ToInt32(Session["UserID"]);

            // Redirect to the ShowUserProfile action with the user's ID
            return RedirectToAction("ShowUserProfile", new { userId = userId });
        }

        // Helper method to fetch user profile data
        private dynamic GetUserProfile(int userId)
        {

            try
            {
                conn.Open();

                using (SqlCommand cmdUser = new SqlCommand("usp_GetUserProfileByID", conn))
                {
                    cmdUser.CommandType = CommandType.StoredProcedure;
                    cmdUser.Parameters.AddWithValue("@UserID", userId);

                    using (SqlDataReader reader = cmdUser.ExecuteReader())
                    {
                        if (reader.HasRows && reader.Read())
                        {
                            return new
                            {
                                UserID = reader["UserID"],
                                FirstName = reader["FirstName"],
                                LastName = reader["LastName"],
                                Username = reader["Username"],
                                DateOfBirth = reader["DateOfBirth"],
                                Gender = reader["Gender"],
                                Mobile = reader["Mobile"],
                                Email = reader["Email"],
                                UserImage = reader["UserImage"],
                                CreatedAt = reader["CreatedAt"],
                                IsActive = reader["IsActive"],
                                BioData = reader["BioData"],
                                Followers = reader["Followers"],
                                Following = reader["Following"],
                                PostsCount = reader["PostsCount"]
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage = "Error: " + ex.Message;
            }
            finally
            {
                conn.Close();
            }

            return null;
        }



        [HttpPost]
        public JsonResult GetUsersByUsername(string searchTerm)
        {
            List<object> users = new List<object>();

            try
            {
                conn.Open();
                var command = new SqlCommand("usp_SearchUserByName", conn);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@SearchTerm", searchTerm ?? "");

                SqlDataReader reader = command.ExecuteReader();

                if (searchTerm != "" || searchTerm==null)
                {
                    if (reader.HasRows)
                    {
                        while (reader.Read())
                        {
                            users.Add(new
                            {
                                UserID = reader["UserID"],
                                FirstName = reader["FirstName"],
                                LastName = reader["LastName"],
                                Username = reader["Username"],
                                UserImage = reader["UserImage"]
                            });
                        }
                    }
                }
                else
                {
                    users.Clear();
                }

                return Json(users, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                {
                    conn.Close();
                }
            }
        }
    }
}