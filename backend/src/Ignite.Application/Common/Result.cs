namespace Ignite.Application.Common;

/// <summary>
/// Represents the result of an operation that can either succeed or fail.
/// This pattern allows for explicit error handling without exceptions,
/// making the code more predictable and easier to test.
/// Ready for microservices: errors can be serialized and passed between services.
/// </summary>
public class Result
{
    protected Result(bool isSuccess, Error error)
    {
        if (isSuccess && error != Error.None)
            throw new InvalidOperationException("Success result cannot have an error.");
        
        if (!isSuccess && error == Error.None)
            throw new InvalidOperationException("Failure result must have an error.");
        
        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error Error { get; }

    public static Result Success() => new(true, Error.None);
    public static Result Failure(Error error) => new(false, error);
    
    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, Error.None);
    public static Result<TValue> Failure<TValue>(Error error) => new(default, false, error);
    
    public static Result<TValue> Create<TValue>(TValue? value) =>
        value is not null ? Success(value) : Failure<TValue>(Error.NullValue);
}

/// <summary>
/// Generic result with a value. Used for operations that return data.
/// </summary>
public class Result<TValue> : Result
{
    private readonly TValue? _value;

    protected internal Result(TValue? value, bool isSuccess, Error error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access value of a failed result.");

    public static implicit operator Result<TValue>(TValue? value) => Create(value);
}

/// <summary>
/// Represents an error with a code and message.
/// Code can be used for localization and error handling on the client.
/// </summary>
public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "The specified value is null.");
    
    // File Storage Errors
    public static readonly Error FileNotProvided = new("File.NotProvided", "No file was provided.");
    public static readonly Error FileTooLarge = new("File.TooLarge", "The file size exceeds the maximum allowed.");
    public static readonly Error FileTypeNotAllowed = new("File.TypeNotAllowed", "The file type is not allowed.");
    public static readonly Error FileExtensionNotAllowed = new("File.ExtensionNotAllowed", "The file extension is not allowed.");
    public static readonly Error FileUploadFailed = new("File.UploadFailed", "Failed to upload the file.");
    
    // Post Errors
    public static readonly Error PostNotFound = new("Post.NotFound", "The post was not found.");
    public static readonly Error PostTypeInvalid = new("Post.TypeInvalid", "The post type is invalid.");
    public static readonly Error PostCreationFailed = new("Post.CreationFailed", "Failed to create the post.");
    
    // User Errors
    public static readonly Error UserNotFound = new("User.NotFound", "The user was not found.");
    public static readonly Error Unauthorized = new("Auth.Unauthorized", "User is not authorized.");
    
    /// <summary>
    /// Creates a validation error with custom message.
    /// </summary>
    public static Error Validation(string message) => new("Validation.Error", message);
    
    /// <summary>
    /// Creates an error with custom code and message.
    /// </summary>
    public static Error Custom(string code, string message) => new(code, message);
}
