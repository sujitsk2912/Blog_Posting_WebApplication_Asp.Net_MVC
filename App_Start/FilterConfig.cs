using System.Web;
using System.Web.Mvc;
using static Blog_Posting_WebApplication.Controllers.Account.AccountController;

namespace Blog_Posting_WebApplication
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            //filters.Add(new AuthenticationFilter());

        }
    }
}
