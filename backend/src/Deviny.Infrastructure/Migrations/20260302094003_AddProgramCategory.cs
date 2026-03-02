using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "TrainingPrograms",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Training");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "MealPrograms",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Diet");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "MealPrograms");
        }
    }
}
