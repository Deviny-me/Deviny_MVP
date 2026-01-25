namespace Ignite.Domain.Enums;

public enum XpEventType
{
    // Trainer events
    TrainerCreatedProgram,
    TrainerUpdatedProgram,
    TrainerScheduledSession,
    TrainerCompletedCallSession,
    TrainerAddedCertificate,
    TrainerAddedAchievement,
    
    // User/Student events
    UserPurchasedProgram,
    UserCompletedProgram,
    UserLeftReview,
    UserCompletedWorkout,
    UserLoggedProgress,
    
    // General events
    ProfileCompleted,
    FirstLogin,
    DailyLogin
}
