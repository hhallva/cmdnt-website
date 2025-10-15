using DataLayer.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DataLayer.Services
{
    public class TokenService(IConfiguration config)
    {
        public string GenerateToken(User user)
        {
            var keyString = config["JWT:Key"];
            if (string.IsNullOrEmpty(keyString))
                throw new InvalidOperationException("JWT:Key configuration value is missing or empty.");

            var key = Encoding.UTF8.GetBytes(keyString);
            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature);
            var claims = new List<Claim>() { new(ClaimTypes.NameIdentifier, user.Login) };

            var token = new JwtSecurityToken(
                claims: claims,
                signingCredentials: credentials,
                expires: DateTime.Now.AddHours(1));
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
