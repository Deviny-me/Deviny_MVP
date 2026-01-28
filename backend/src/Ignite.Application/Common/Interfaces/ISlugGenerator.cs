namespace Ignite.Application.Common.Interfaces;

public interface ISlugGenerator
{
    string Transliterate(string text);
    string GenerateSlug(string name, int? suffix = null);
}
