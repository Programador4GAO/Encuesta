using Microsoft.AspNetCore.Mvc;

namespace ValidadorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AdValidator _validator;

        public AuthController(IConfiguration config)
        {
            var server = config["ActiveDirectory:Server"] ?? "192.168.0.240";
            _validator = new AdValidator(server);
        }

        /// <summary>
        /// GET /api/auth/current-user
        /// Obtiene el usuario de Windows automáticamente
        /// </summary>
        [HttpGet("current-user")]
        public IActionResult GetCurrentUser()
        {
            try
            {
                var windowsUser = _validator.GetCurrentWindowsUser();
                var userInfo = _validator.GetUserInfo(windowsUser);

                string domain = "";
                string username = windowsUser;

                if (windowsUser.Contains("\\"))
                {
                    var parts = windowsUser.Split('\\');
                    domain = parts[0];
                    username = parts[1];
                }

                return Ok(new
                {
                    success = true,
                    username = username,
                    domain = domain,
                    fullUsername = windowsUser,
                    displayName = userInfo?.DisplayName,
                    email = userInfo?.Email
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Error obteniendo usuario: " + ex.Message
                });
            }
        }

        /// <summary>
        /// POST /api/auth/validate
        /// Valida credenciales contra Active Directory
        /// </summary>
        [HttpPost("validate")]
        public IActionResult ValidateCredentials([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Ok(new
                {
                    success = false,
                    message = "Usuario y contraseña son requeridos"
                });
            }

            try
            {
                var displayName = _validator.GetUserFullName(request.Username, request.Password);

                if (displayName != null)
                {
                    var userInfo = _validator.GetUserInfo(request.Username);

                    return Ok(new
                    {
                        success = true,
                        displayName = displayName,
                        email = userInfo?.Email,
                        message = "Credenciales correctas"
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Credenciales incorrectas"
                    });
                }
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Error de conexión con AD: " + ex.Message
                });
            }
        }

        /// <summary>
        /// GET /api/auth/ping
        /// Health check
        /// </summary>
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new
            {
                status = "ok",
                service = "ValidadorAPI",
                timestamp = DateTime.Now,
                message = "Servicio de validación AD funcionando"
            });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
