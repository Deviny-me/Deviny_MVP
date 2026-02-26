using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPublicToPrograms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "TrainingPrograms",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "MealPrograms",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "MealPrograms");
        }
    }
}
