using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchasePolymorphicSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProgramPurchases_TrainingPrograms_ProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropIndex(
                name: "IX_ProgramPurchases_ProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropColumn(
                name: "ProgramId",
                table: "ProgramPurchases");

            migrationBuilder.AddColumn<Guid>(
                name: "MealProgramId",
                table: "ProgramPurchases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProgramType",
                table: "ProgramPurchases",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "TrainingProgramId",
                table: "ProgramPurchases",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPurchases_MealProgramId",
                table: "ProgramPurchases",
                column: "MealProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPurchases_TrainingProgramId",
                table: "ProgramPurchases",
                column: "TrainingProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPurchases_User_Program_Tier",
                table: "ProgramPurchases",
                columns: new[] { "UserId", "TrainingProgramId", "MealProgramId", "Tier" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramPurchases_MealPrograms_MealProgramId",
                table: "ProgramPurchases",
                column: "MealProgramId",
                principalTable: "MealPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramPurchases_TrainingPrograms_TrainingProgramId",
                table: "ProgramPurchases",
                column: "TrainingProgramId",
                principalTable: "TrainingPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProgramPurchases_MealPrograms_MealProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropForeignKey(
                name: "FK_ProgramPurchases_TrainingPrograms_TrainingProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropIndex(
                name: "IX_ProgramPurchases_MealProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropIndex(
                name: "IX_ProgramPurchases_TrainingProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropIndex(
                name: "IX_ProgramPurchases_User_Program_Tier",
                table: "ProgramPurchases");

            migrationBuilder.DropColumn(
                name: "MealProgramId",
                table: "ProgramPurchases");

            migrationBuilder.DropColumn(
                name: "ProgramType",
                table: "ProgramPurchases");

            migrationBuilder.DropColumn(
                name: "TrainingProgramId",
                table: "ProgramPurchases");

            migrationBuilder.AddColumn<Guid>(
                name: "ProgramId",
                table: "ProgramPurchases",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ProgramPurchases_ProgramId",
                table: "ProgramPurchases",
                column: "ProgramId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramPurchases_TrainingPrograms_ProgramId",
                table: "ProgramPurchases",
                column: "ProgramId",
                principalTable: "TrainingPrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
