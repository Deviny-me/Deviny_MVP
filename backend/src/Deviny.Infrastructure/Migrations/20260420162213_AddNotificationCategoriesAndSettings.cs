using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationCategoriesAndSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AchievementFeedEnabled",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ContentUpdatesEnabled",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MessagingEnabled",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificationsEnabled",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "WorkoutRemindersEnabled",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Notifications",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AchievementFeedEnabled",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "ContentUpdatesEnabled",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "MessagingEnabled",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "NotificationsEnabled",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "WorkoutRemindersEnabled",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Notifications");
        }
    }
}
