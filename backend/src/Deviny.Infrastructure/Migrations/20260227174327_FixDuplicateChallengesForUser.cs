using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Deviny.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixDuplicateChallengesForUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make generic FIRST_POST and FIRST_MESSAGE_SENT achievements Trainer-specific
            // so Users only see their own USER_FIRST_POST / USER_FIRST_MESSAGE
            migrationBuilder.Sql(@"
                UPDATE ""Achievements""
                SET ""TargetRole"" = 'Trainer',
                    ""Description"" = 'Опубликуйте свой первый пост как тренер',
                    ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" = 'FIRST_POST' AND ""TargetRole"" IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Achievements""
                SET ""TargetRole"" = 'Trainer',
                    ""Description"" = 'Отправьте своё первое сообщение как тренер',
                    ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" = 'FIRST_MESSAGE_SENT' AND ""TargetRole"" IS NULL;
            ");

            // Same for linked challenges
            migrationBuilder.Sql(@"
                UPDATE ""Challenges""
                SET ""TargetRole"" = 'Trainer',
                    ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" = 'CHALLENGE_FIRST_POST' AND ""TargetRole"" IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Challenges""
                SET ""TargetRole"" = 'Trainer',
                    ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" = 'CHALLENGE_FIRST_MESSAGE' AND ""TargetRole"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert back to generic (null TargetRole)
            migrationBuilder.Sql(@"
                UPDATE ""Achievements""
                SET ""TargetRole"" = NULL, ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" IN ('FIRST_POST', 'FIRST_MESSAGE_SENT') AND ""TargetRole"" = 'Trainer';
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Challenges""
                SET ""TargetRole"" = NULL, ""UpdatedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Code"" IN ('CHALLENGE_FIRST_POST', 'CHALLENGE_FIRST_MESSAGE') AND ""TargetRole"" = 'Trainer';
            ");
        }
    }
}
