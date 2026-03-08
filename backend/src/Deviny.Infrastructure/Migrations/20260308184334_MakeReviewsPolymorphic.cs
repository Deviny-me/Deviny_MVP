using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeReviewsPolymorphic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProgramReviews_TrainingPrograms_ProgramId",
                table: "ProgramReviews");

            migrationBuilder.DropIndex(
                name: "IX_ProgramReviews_ProgramId_UserId",
                table: "ProgramReviews");

            migrationBuilder.DropColumn(
                name: "ProgramId",
                table: "ProgramReviews");

            migrationBuilder.AddColumn<Guid>(
                name: "MealProgramId",
                table: "ProgramReviews",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProgramType",
                table: "ProgramReviews",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "TrainingProgramId",
                table: "ProgramReviews",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgramReviews_MealProgramId_UserId",
                table: "ProgramReviews",
                columns: new[] { "MealProgramId", "UserId" },
                unique: true,
                filter: "\"MealProgramId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramReviews_TrainingProgramId_UserId",
                table: "ProgramReviews",
                columns: new[] { "TrainingProgramId", "UserId" },
                unique: true,
                filter: "\"TrainingProgramId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramReviews_MealPrograms_MealProgramId",
                table: "ProgramReviews",
                column: "MealProgramId",
                principalTable: "MealPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramReviews_TrainingPrograms_TrainingProgramId",
                table: "ProgramReviews",
                column: "TrainingProgramId",
                principalTable: "TrainingPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProgramReviews_MealPrograms_MealProgramId",
                table: "ProgramReviews");

            migrationBuilder.DropForeignKey(
                name: "FK_ProgramReviews_TrainingPrograms_TrainingProgramId",
                table: "ProgramReviews");

            migrationBuilder.DropIndex(
                name: "IX_ProgramReviews_MealProgramId_UserId",
                table: "ProgramReviews");

            migrationBuilder.DropIndex(
                name: "IX_ProgramReviews_TrainingProgramId_UserId",
                table: "ProgramReviews");

            migrationBuilder.DropColumn(
                name: "MealProgramId",
                table: "ProgramReviews");

            migrationBuilder.DropColumn(
                name: "ProgramType",
                table: "ProgramReviews");

            migrationBuilder.DropColumn(
                name: "TrainingProgramId",
                table: "ProgramReviews");

            migrationBuilder.AddColumn<Guid>(
                name: "ProgramId",
                table: "ProgramReviews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ProgramReviews_ProgramId_UserId",
                table: "ProgramReviews",
                columns: new[] { "ProgramId", "UserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramReviews_TrainingPrograms_ProgramId",
                table: "ProgramReviews",
                column: "ProgramId",
                principalTable: "TrainingPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
