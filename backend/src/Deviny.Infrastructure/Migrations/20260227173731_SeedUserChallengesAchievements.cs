using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedUserChallengesAchievements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Achievement: USER_FIRST_POST — "Начало пути!"
            migrationBuilder.Sql(@"
                INSERT INTO ""Achievements"" (""Id"", ""Code"", ""Title"", ""Description"", ""IconKey"", ""ColorKey"", ""Rarity"", ""XpReward"", ""IsActive"", ""TargetRole"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'USER_FIRST_POST', 'Начало пути!', 'Опубликуйте свой первый пост как пользователь', 'pen-line', 'indigo', 'Common', 25, true, 'User', NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Achievements"" WHERE ""Code"" = 'USER_FIRST_POST');
            ");

            // Achievement: USER_FIRST_MESSAGE — "Знакомство!"
            migrationBuilder.Sql(@"
                INSERT INTO ""Achievements"" (""Id"", ""Code"", ""Title"", ""Description"", ""IconKey"", ""ColorKey"", ""Rarity"", ""XpReward"", ""IsActive"", ""TargetRole"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'USER_FIRST_MESSAGE', 'Знакомство!', 'Отправьте своё первое сообщение в чат', 'message-circle', 'cyan', 'Common', 20, true, 'User', NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Achievements"" WHERE ""Code"" = 'USER_FIRST_MESSAGE');
            ");

            // Challenge: CHALLENGE_USER_FIRST_POST → linked to USER_FIRST_POST
            migrationBuilder.Sql(@"
                INSERT INTO ""Challenges"" (""Id"", ""Code"", ""Title"", ""Description"", ""Type"", ""TargetValue"", ""IsActive"", ""TargetRole"", ""AchievementId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'CHALLENGE_USER_FIRST_POST', 'Начало пути', 'Опубликуйте свой первый пост', 'OneTime', 1, true, 'User',
                       (SELECT ""Id"" FROM ""Achievements"" WHERE ""Code"" = 'USER_FIRST_POST' LIMIT 1),
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Challenges"" WHERE ""Code"" = 'CHALLENGE_USER_FIRST_POST');
            ");

            // Challenge: CHALLENGE_USER_FIRST_MESSAGE → linked to USER_FIRST_MESSAGE
            migrationBuilder.Sql(@"
                INSERT INTO ""Challenges"" (""Id"", ""Code"", ""Title"", ""Description"", ""Type"", ""TargetValue"", ""IsActive"", ""TargetRole"", ""AchievementId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), 'CHALLENGE_USER_FIRST_MESSAGE', 'Первое знакомство', 'Отправьте своё первое сообщение в чат', 'OneTime', 1, true, 'User',
                       (SELECT ""Id"" FROM ""Achievements"" WHERE ""Code"" = 'USER_FIRST_MESSAGE' LIMIT 1),
                       NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM ""Challenges"" WHERE ""Code"" = 'CHALLENGE_USER_FIRST_MESSAGE');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DELETE FROM ""Challenges"" WHERE ""Code"" IN ('CHALLENGE_USER_FIRST_POST', 'CHALLENGE_USER_FIRST_MESSAGE');");
            migrationBuilder.Sql(@"DELETE FROM ""Achievements"" WHERE ""Code"" IN ('USER_FIRST_POST', 'USER_FIRST_MESSAGE');");
        }
    }
}
