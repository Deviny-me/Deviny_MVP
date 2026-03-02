using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <summary>
    /// Seeds Nutritionist-specific achievements and challenges.
    /// Idempotent: uses WHERE NOT EXISTS to skip already-present rows.
    /// Mirrors the pattern established in <see cref="SeedUserChallengesAchievements"/>.
    /// </summary>
    public partial class SeedNutritionistChallengesAchievements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Nutritionist Achievements ──

            // FIRST_MEAL_PLAN — "Автор рациона" (Rare, 50 XP)
            migrationBuilder.Sql(@"
                INSERT INTO ""Achievements"" (""Id"", ""Code"", ""Title"", ""Description"", ""IconKey"", ""ColorKey"", ""Rarity"", ""XpReward"", ""IsActive"", ""TargetRole"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'FIRST_MEAL_PLAN', 'Автор рациона', 'Создайте свою первую программу питания',
                       'apple', 'green', 'Rare', 50, true, 'Nutritionist',
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Achievements"" WHERE ""Code"" = 'FIRST_MEAL_PLAN');
            ");

            // NUTRI_FIRST_POST — "Нутри-блогер" (Common, 25 XP)
            migrationBuilder.Sql(@"
                INSERT INTO ""Achievements"" (""Id"", ""Code"", ""Title"", ""Description"", ""IconKey"", ""ColorKey"", ""Rarity"", ""XpReward"", ""IsActive"", ""TargetRole"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'NUTRI_FIRST_POST', 'Нутри-блогер', 'Опубликуйте свой первый пост как нутриолог',
                       'pen-line', 'teal', 'Common', 25, true, 'Nutritionist',
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Achievements"" WHERE ""Code"" = 'NUTRI_FIRST_POST');
            ");

            // NUTRI_FIRST_MESSAGE — "Забота о клиенте" (Common, 20 XP)
            migrationBuilder.Sql(@"
                INSERT INTO ""Achievements"" (""Id"", ""Code"", ""Title"", ""Description"", ""IconKey"", ""ColorKey"", ""Rarity"", ""XpReward"", ""IsActive"", ""TargetRole"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'NUTRI_FIRST_MESSAGE', 'Забота о клиенте', 'Отправьте первое сообщение клиенту',
                       'message-circle', 'emerald', 'Common', 20, true, 'Nutritionist',
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Achievements"" WHERE ""Code"" = 'NUTRI_FIRST_MESSAGE');
            ");

            // ── Nutritionist Challenges (each linked to its achievement) ──

            // CHALLENGE_FIRST_MEAL_PLAN → FIRST_MEAL_PLAN
            migrationBuilder.Sql(@"
                INSERT INTO ""Challenges"" (""Id"", ""Code"", ""Title"", ""Description"", ""Type"", ""TargetValue"", ""IsActive"", ""TargetRole"", ""AchievementId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'CHALLENGE_FIRST_MEAL_PLAN', 'Создай рацион', 'Создайте свою первую программу питания',
                       'OneTime', 1, true, 'Nutritionist',
                       (SELECT ""Id"" FROM ""Achievements"" WHERE ""Code"" = 'FIRST_MEAL_PLAN' LIMIT 1),
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Challenges"" WHERE ""Code"" = 'CHALLENGE_FIRST_MEAL_PLAN');
            ");

            // CHALLENGE_NUTRI_FIRST_POST → NUTRI_FIRST_POST
            migrationBuilder.Sql(@"
                INSERT INTO ""Challenges"" (""Id"", ""Code"", ""Title"", ""Description"", ""Type"", ""TargetValue"", ""IsActive"", ""TargetRole"", ""AchievementId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'CHALLENGE_NUTRI_FIRST_POST', 'Поделись знаниями', 'Опубликуйте свой первый пост как нутриолог',
                       'OneTime', 1, true, 'Nutritionist',
                       (SELECT ""Id"" FROM ""Achievements"" WHERE ""Code"" = 'NUTRI_FIRST_POST' LIMIT 1),
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Challenges"" WHERE ""Code"" = 'CHALLENGE_NUTRI_FIRST_POST');
            ");

            // CHALLENGE_NUTRI_FIRST_MESSAGE → NUTRI_FIRST_MESSAGE
            migrationBuilder.Sql(@"
                INSERT INTO ""Challenges"" (""Id"", ""Code"", ""Title"", ""Description"", ""Type"", ""TargetValue"", ""IsActive"", ""TargetRole"", ""AchievementId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'CHALLENGE_NUTRI_FIRST_MESSAGE', 'Свяжись с клиентом', 'Отправьте первое сообщение клиенту',
                       'OneTime', 1, true, 'Nutritionist',
                       (SELECT ""Id"" FROM ""Achievements"" WHERE ""Code"" = 'NUTRI_FIRST_MESSAGE' LIMIT 1),
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Challenges"" WHERE ""Code"" = 'CHALLENGE_NUTRI_FIRST_MESSAGE');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""Challenges""
                WHERE ""Code"" IN ('CHALLENGE_FIRST_MEAL_PLAN', 'CHALLENGE_NUTRI_FIRST_POST', 'CHALLENGE_NUTRI_FIRST_MESSAGE');
            ");
            migrationBuilder.Sql(@"
                DELETE FROM ""Achievements""
                WHERE ""Code"" IN ('FIRST_MEAL_PLAN', 'NUTRI_FIRST_POST', 'NUTRI_FIRST_MESSAGE');
            ");
        }
    }
}
