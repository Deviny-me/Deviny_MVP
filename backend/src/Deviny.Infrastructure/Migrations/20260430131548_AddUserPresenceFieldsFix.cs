using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPresenceFieldsFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                ADD COLUMN IF NOT EXISTS ""IsOnline"" boolean NOT NULL DEFAULT FALSE;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                ADD COLUMN IF NOT EXISTS ""LastSeenAtUtc"" timestamp with time zone NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                DROP COLUMN IF EXISTS ""IsOnline"";
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                DROP COLUMN IF EXISTS ""LastSeenAtUtc"";
            ");
        }
    }
}
