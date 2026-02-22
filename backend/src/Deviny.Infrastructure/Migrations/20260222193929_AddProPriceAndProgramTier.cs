using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProPriceAndProgramTier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ProPrice",
                table: "TrainingPrograms",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "ProgramPurchases",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ProPrice",
                table: "MealPrograms",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProPrice",
                table: "TrainingPrograms");

            migrationBuilder.DropColumn(
                name: "Tier",
                table: "ProgramPurchases");

            migrationBuilder.DropColumn(
                name: "ProPrice",
                table: "MealPrograms");
        }
    }
}
