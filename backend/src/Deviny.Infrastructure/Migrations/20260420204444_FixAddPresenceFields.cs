using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAddPresenceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AddUserPresenceFields migration (20260420101500) had no Designer.cs
            // so EF Core never recognised it and the columns were never created.
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""IsOnline"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""LastSeenAtUtc"" timestamp with time zone;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsOnline", table: "Users");
            migrationBuilder.DropColumn(name: "LastSeenAtUtc", table: "Users");
        }
    }
}
