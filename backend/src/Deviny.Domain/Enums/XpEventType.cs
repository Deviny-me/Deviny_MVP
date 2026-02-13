namespace Deviny.Domain.Enums;

public enum XpEventType
{
    // Trainer events
    TrainerCreatedProgram,
    TrainerUpdatedProgram,
    TrainerScheduledSession,
    TrainerCompletedCallSession,
    TrainerAddedCertificate,
    TrainerAddedAchievement,
    TrainerCreatedPost,
    
    // User/Student events
    UserPurchasedProgram,
    UserCompletedProgram,
    UserLeftReview,
    UserCompletedWorkout,
    UserLoggedProgress,
    UserCreatedPost,
    
    // General events
    ProfileCompleted,
    FirstLogin,
    DailyLogin
}
