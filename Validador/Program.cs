var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.MapControllers();

Console.WriteLine("==========================================");
Console.WriteLine("  VALIDADOR API - Active Directory");
Console.WriteLine("==========================================");
Console.WriteLine("  URL: http://localhost:5050");
Console.WriteLine("");
Console.WriteLine("  Endpoints:");
Console.WriteLine("    GET  /api/auth/current-user  -> Usuario Windows");
Console.WriteLine("    POST /api/auth/validate      -> Validar password");
Console.WriteLine("    GET  /api/auth/ping          -> Health check");
Console.WriteLine("==========================================");

app.Run("http://localhost:5050");
