using Microsoft.AspNetCore.Mvc;

namespace TestController.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("Đây là Hàm Get");
        }
    }
}