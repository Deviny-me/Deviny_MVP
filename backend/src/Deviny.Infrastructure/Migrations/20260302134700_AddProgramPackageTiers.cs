using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProgramPackageTiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxProSpots",
                table: "TrainingPrograms",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxStandardSpots",
                table: "TrainingPrograms",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StandardPrice",
                table: "TrainingPrograms",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxProSpots",
                table: "MealPrograms",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxStandardSpots",
                table: "MealPrograms",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StandardPrice",
                table: "MealPrograms",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxProSpots",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "MaxStandardSpots",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "StandardPrice",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "MaxProSpots",
                table: "MealPrograms");

            migrationBuilder.DropColumn(
                name: "MaxStandardSpots",
                table: "MealPrograms");

            migrationBuilder.DropColumn(
                name: "StandardPrice",
                table: "MealPrograms");
        }
    }
}
