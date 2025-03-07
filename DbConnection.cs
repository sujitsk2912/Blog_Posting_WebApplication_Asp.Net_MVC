using System;
using System.Configuration;
using System.Data.SqlClient;

namespace Blog_Posting_WebApplication
{
    public class DbConnection
    {
        static SqlConnection _connection = null;

        public static SqlConnection GetConnection()
        {
            if (_connection == null)
            {
                string connectionString = ConfigurationManager.ConnectionStrings["BLOG_POSTER_DB"].ConnectionString;
                if (string.IsNullOrEmpty(connectionString))
                {
                    throw new Exception("Connection string 'BLOG_POSTER_DB' not found in web.config.");
                }
                _connection = new SqlConnection(connectionString);
            }
            return _connection;
        }

        public static void TestConnection()
        {
            using (SqlConnection conn = GetConnection())
            {
                try
                {
                    conn.Open();
                    Console.WriteLine("Connection successful!");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Connection failed: " + ex.Message);
                }
            }
        }
    }


}