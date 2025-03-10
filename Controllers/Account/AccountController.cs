using Microsoft.Ajax.Utilities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Mvc;

namespace Blog_Posting_WebApplication.Controllers.Account
{

    public class AccountController : Controller
    {

        static SqlConnection conn = DbConnection.GetConnection();
        static SqlCommand cmd;
        static SqlDataAdapter adapter;
        static DataTable dt;



        // GET: Account
        // GET: Autentication

        [HttpGet]
        public ActionResult Login()
        {
            return View();
        }


        [HttpPost]
        public JsonResult Login(string emailorphone, string password)
        {
            try
            {
                conn.Open();

                // ✅ Check if Email or Mobile exists
                SqlCommand checkCmd = new SqlCommand("sp_CheckUserLogin", conn);

                checkCmd.CommandType = CommandType.StoredProcedure;
                checkCmd.Parameters.AddWithValue("@Username", emailorphone);
                checkCmd.Parameters.AddWithValue("@Email", emailorphone);
                checkCmd.Parameters.AddWithValue("@Mobile", emailorphone);
                checkCmd.Parameters.AddWithValue("@Password", password);

                SqlDataReader reader = checkCmd.ExecuteReader();


                if (reader.Read())
                {
                    // ✅ Store UserID in Session
                    int userId = Convert.ToInt32(reader["UserID"]);
                    Session["UserID"] = userId;

                    // ✅ Store UserID in Cookie
                    HttpCookie userCookie = new HttpCookie("UserID");
                    userCookie.Value = userId.ToString();
                    userCookie.Expires = DateTime.Now.AddDays(1); // Set cookie expiration
                    Response.Cookies.Add(userCookie);

                    return Json(new { success = true, message = "Login successful!" }, JsonRequestBehavior.AllowGet);
                }

                return Json(new { success = false, message = "Incorrect Email or Phone !" }, JsonRequestBehavior.AllowGet);

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

        [HttpGet]
        public ActionResult Logout()
        {
            // ✅ Clear Session
            Session.Clear(); // Removes all keys and values from the session
            Session.Abandon(); // Abandons the current session

            // ✅ Expire All Cookies
            if (Request.Cookies["UserID"] != null)
            {
                HttpCookie userCookie = new HttpCookie("UserID")
                {
                    Expires = DateTime.Now.AddDays(-1) // Expire the cookie by setting its expiration to a past date
                };
                Response.Cookies.Add(userCookie); // Add the expired cookie to the response
            }

            // ✅ Clear all other cookies (optional)
            string[] cookieNames = Request.Cookies.AllKeys;
            foreach (string cookieName in cookieNames)
            {
                HttpCookie cookie = new HttpCookie(cookieName)
                {
                    Expires = DateTime.Now.AddDays(-1) // Expire the cookie
                };
                Response.Cookies.Add(cookie); // Add the expired cookie to the response
            }

            // ✅ Redirect to the login page
            return RedirectToAction("Login", "Account");
        }

        [HttpGet]
        public ActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Register(string firstName, string lastName, string dateOfBirth, string gender, string mobile, string email, string password)
        {
            try
            {

                conn.Open();

                // ✅ Check if Email or Mobile already exists
                SqlCommand checkCmd = new SqlCommand("sp_CheckUserExists", conn);

                checkCmd.CommandType = CommandType.StoredProcedure;
                checkCmd.Parameters.AddWithValue("@Email", email);
                checkCmd.Parameters.AddWithValue("@Mobile", mobile);

                int existingUserCount = (int)checkCmd.ExecuteScalar();

                if (existingUserCount > 0)
                {
                    conn.Close();
                    // ✅ If user already exists, return error message
                    return Json(new { success = false, message = "Email or mobile already exists." }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    // ✅ Insert User if Email and Mobile are unique
                    SqlCommand cmd = new SqlCommand("sp_InsertUserWithLogin", conn);


                    // ✅ Generate a random username
                    string userName = GenerateUniqueUsername(firstName, lastName);


                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@FirstName", firstName);
                    cmd.Parameters.AddWithValue("@LastName", lastName);
                    cmd.Parameters.AddWithValue("@Username", userName);
                    cmd.Parameters.AddWithValue("@DateOfBirth", dateOfBirth);
                    cmd.Parameters.AddWithValue("@Gender", gender);
                    cmd.Parameters.AddWithValue("@Mobile", mobile);
                    cmd.Parameters.AddWithValue("@Email", email);
                    cmd.Parameters.AddWithValue("@Password", password);

                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected > 0)
                    {
                        // ✅ Success - redirect to login
                        return Json(new { success = true, message = "Registration successful! Redirecting to login...", redirectTo = Url.Action("Login", "Account") }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { success = false, message = "Registration failed. Please try again." }, JsonRequestBehavior.AllowGet);
                    }

                }

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


        private string GenerateUniqueUsername(string firstName, string lastName)
        {
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            {
                throw new ArgumentException("First name and last name are required.");
            }

            string userName;
            bool isUnique;
            int attempts = 0;

            do
            {
                // Generate a random username that contains both first name and last name
                userName = GenerateRandomUsername(firstName, lastName);

                // Check if the username is unique
                isUnique = IsUsernameUnique(userName);

                attempts++;
                if (attempts > 10) // Prevent infinite loops
                {
                    throw new Exception("Unable to generate a unique username. Please try again.");
                }
            } while (!isUnique); // Repeat until a unique username is found

            return userName;
        }

        private bool IsUsernameUnique(string username)
        {
            using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM UserDetails WHERE Username = @Username", conn))
            {
                cmd.Parameters.AddWithValue("@Username", username);
                int count = (int)cmd.ExecuteScalar();
                return count == 0; // Return true if the username is unique
            }
        }

        private string GenerateRandomUsername(string firstName, string lastName)
        {
            firstName = firstName.ToLower().Trim();
            lastName = lastName.ToLower().Trim();

            // Random number and letter generators
            Random random = new Random();
            int randomNum = random.Next(10, 99); // 2-digit number
            char randomLetter = (char)('a' + random.Next(0, 26)); // Random letter (a-z)

            // Different username patterns that always include both first name and last name
            string[] patterns = new string[]
            {
                firstName + lastName, // johnsmith
                firstName + "." + lastName, // john.smith
                firstName + "_" + lastName, // john_smith
                firstName + "." + lastName + randomNum, // john.smith42
                firstName + "_" + lastName + randomNum, // john_smith12
                firstName + lastName + randomNum, // johnsmith42
                //firstName + lastName + randomLetter, // johnsmithx
                //firstName.Substring(0, 1) + lastName, // jsmith
                //firstName + lastName.Substring(0, 1), // johns
                firstName.Substring(0, 1) + lastName + randomNum, // jsmith42
                firstName + lastName.Substring(0, 1) + randomNum // johns42
            };

            // Return a random pattern
            return patterns[random.Next(patterns.Length)];
        }
    }
}