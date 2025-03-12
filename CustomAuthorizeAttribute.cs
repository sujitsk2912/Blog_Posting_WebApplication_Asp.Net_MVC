using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Blog_Posting_WebApplication
{
	public class CustomAuthorizeAttribute : AuthorizeAttribute
    {
        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            // Redirect unauthorized users to the home page
            filterContext.Result = new RedirectResult("~/Home/Index");
        }
    }
}