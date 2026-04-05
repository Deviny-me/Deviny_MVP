using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPurposeToEmailOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmailOtps_Email_OtpCode",
                table: "EmailOtps");

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                table: "EmailOtps",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "registration");

            migrationBuilder.CreateIndex(
                name: "IX_EmailOtps_Email_OtpCode_Purpose",
                table: "EmailOtps",
                columns: new[] { "Email", "OtpCode", "Purpose" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmailOtps_Email_OtpCode_Purpose",
                table: "EmailOtps");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "EmailOtps");

            migrationBuilder.CreateIndex(
                name: "IX_EmailOtps_Email_OtpCode",
                table: "EmailOtps",
                columns: new[] { "Email", "OtpCode" });
        }
    }
}
