using System.DirectoryServices.AccountManagement;
using System.Security.Principal;

namespace ValidadorAPI
{

    public class AdValidator
    {
        private readonly string _domainServer;

        public AdValidator(string servidorIp = "192.168.0.240")
        {
            _domainServer = servidorIp;
        }

        /// <summary>
        /// Obtiene el usuario de Windows actual del servidor
        /// </summary>
        public string GetCurrentWindowsUser()
        {
            return WindowsIdentity.GetCurrent().Name;
        }

        /// <summary>
        /// Valida credenciales contra AD y retorna el nombre completo
        /// </summary>
        public string? GetUserFullName(string username, string password)
        {
            string cleanUsername = CleanUsername(username);

            try
            {
                using (PrincipalContext pc = new PrincipalContext(ContextType.Domain, _domainServer))
                {
                    if (pc.ValidateCredentials(cleanUsername, password))
                    {
                        UserPrincipal? user = UserPrincipal.FindByIdentity(pc, cleanUsername);
                        if (user != null)
                        {
                            return !string.IsNullOrEmpty(user.DisplayName) ? user.DisplayName : user.Name;
                        }
                    }
                }
            }
            catch (Exception)
            {
                
            }
            return null;
        }

        /// <summary>
        /// Solo valida credenciales (retorna true/false)
        /// </summary>
        public bool ValidateCredentials(string username, string password)
        {
            string cleanUsername = CleanUsername(username);

            try
            {
                using (PrincipalContext pc = new PrincipalContext(ContextType.Domain, _domainServer))
                {
                    return pc.ValidateCredentials(cleanUsername, password);
                }
            }
            catch
            {
                return false;
            }
        }


        public UserInfo? GetUserInfo(string username)
        {
            string cleanUsername = CleanUsername(username);

            try
            {
                using (PrincipalContext pc = new PrincipalContext(ContextType.Domain, _domainServer))
                {
                    UserPrincipal? user = UserPrincipal.FindByIdentity(pc, cleanUsername);

                    if (user != null)
                    {
                        return new UserInfo
                        {
                            Username = cleanUsername,
                            DisplayName = user.DisplayName ?? user.Name,
                            Email = user.EmailAddress,
                            Domain = ExtractDomain(username)
                        };
                    }
                }
            }
            catch
            {
                // Ignorar errores
            }
            return null;
        }

        private string CleanUsername(string username)
        {
            if (username.Contains("\\"))
                return username.Split('\\')[1];
            if (username.Contains("@"))
                return username.Split('@')[0];
            return username;
        }

        private string? ExtractDomain(string username)
        {
            if (username.Contains("\\"))
                return username.Split('\\')[0];
            return null;
        }
    }

    public class UserInfo
    {
        public string Username { get; set; } = "";
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? Domain { get; set; }
    }
}
