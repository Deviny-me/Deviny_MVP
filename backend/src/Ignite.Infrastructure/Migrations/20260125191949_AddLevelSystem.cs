using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ignite.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLevelSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LevelDefinitions",
                columns: table => new
                {
                    Level = table.Column<int>(type: "int", nullable: false),
                    RequiredXp = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevelDefinitions", x => x.Level);
                });

            migrationBuilder.CreateTable(
                name: "UserLevels",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentLevel = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    CurrentXp = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LifetimeXp = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLevelUpAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLevels", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserLevels_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "XpTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<int>(type: "int", nullable: false),
                    XpAmount = table.Column<int>(type: "int", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SourceEntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XpTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_XpTransactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserLevels_CurrentLevel",
                table: "UserLevels",
                column: "CurrentLevel");

            migrationBuilder.CreateIndex(
                name: "IX_UserLevels_LifetimeXp",
                table: "UserLevels",
                column: "LifetimeXp");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_EventType",
                table: "XpTransactions",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_IdempotencyKey",
                table: "XpTransactions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_UserId_CreatedAt",
                table: "XpTransactions",
                columns: new[] { "UserId", "CreatedAt" });

            // Seed LevelDefinitions with progressive XP requirements
            // Formula: Level 1 = 0, Level 2 = 100, Level 3 = 250, Level 4 = 450...
            // Each level requires 50 more XP than the previous increment
            var now = DateTime.UtcNow;
            var levelTitles = new Dictionary<int, string>
            {
                { 1, "Новичок" },
                { 5, "Начинающий" },
                { 10, "Любитель" },
                { 15, "Продвинутый" },
                { 20, "Опытный" },
                { 25, "Эксперт" },
                { 30, "Мастер" },
                { 35, "Гуру" },
                { 40, "Легенда" },
                { 45, "Чемпион" },
                { 50, "Грандмастер" }
            };

            int requiredXp = 0;
            int increment = 100;
            
            for (int level = 1; level <= 50; level++)
            {
                string? title = levelTitles.ContainsKey(level) ? levelTitles[level] : null;
                
                migrationBuilder.InsertData(
                    table: "LevelDefinitions",
                    columns: new[] { "Level", "RequiredXp", "Title", "CreatedAt", "UpdatedAt" },
                    values: new object[] { level, requiredXp, title, now, now });

                requiredXp += increment;
                increment += 50; // Progressive increase
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LevelDefinitions");

            migrationBuilder.DropTable(
                name: "UserLevels");

            migrationBuilder.DropTable(
                name: "XpTransactions");
        }
    }
}
