using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ignite.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProgramMediaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "TrainingPrograms");

            migrationBuilder.RenameColumn(
                name: "MediaPath",
                table: "TrainingPrograms",
                newName: "CoverImagePath");

            migrationBuilder.AddColumn<string>(
                name: "TrainingVideosPath",
                table: "TrainingPrograms",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TrainingVideosPath",
                table: "TrainingPrograms");

            migrationBuilder.RenameColumn(
                name: "CoverImagePath",
                table: "TrainingPrograms",
                newName: "MediaPath");

            migrationBuilder.AddColumn<string>(
                name: "MediaType",
                table: "TrainingPrograms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
