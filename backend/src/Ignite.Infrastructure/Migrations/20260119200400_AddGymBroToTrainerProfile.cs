using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ignite.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGymBroToTrainerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GymBroId",
                table: "TrainerProfiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainerProfiles_GymBroId",
                table: "TrainerProfiles",
                column: "GymBroId");

            migrationBuilder.AddForeignKey(
                name: "FK_TrainerProfiles_Users_GymBroId",
                table: "TrainerProfiles",
                column: "GymBroId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrainerProfiles_Users_GymBroId",
                table: "TrainerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_TrainerProfiles_GymBroId",
                table: "TrainerProfiles");

            migrationBuilder.DropColumn(
                name: "GymBroId",
                table: "TrainerProfiles");
        }
    }
}
