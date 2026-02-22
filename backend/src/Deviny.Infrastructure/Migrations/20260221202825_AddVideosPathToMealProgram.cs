using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVideosPathToMealProgram : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VideosPath",
                table: "MealPrograms",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideosPath",
                table: "MealPrograms");
        }
    }
}
