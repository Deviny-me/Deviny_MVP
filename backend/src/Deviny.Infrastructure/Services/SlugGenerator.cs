using System.Text;
using System.Text.RegularExpressions;
using Deviny.Application.Common.Interfaces;

namespace Deviny.Infrastructure.Services;

public class SlugGenerator : ISlugGenerator
{
    private static readonly Dictionary<char, string> CyrillicToLatinMap = new()
    {
        {'а', "a"}, {'б', "b"}, {'в', "v"}, {'г', "g"}, {'д', "d"},
        {'е', "e"}, {'ё', "yo"}, {'ж', "zh"}, {'з', "z"}, {'и', "i"},
        {'й', "y"}, {'к', "k"}, {'л', "l"}, {'м', "m"}, {'н', "n"},
        {'о', "o"}, {'п', "p"}, {'р', "r"}, {'с', "s"}, {'т', "t"},
        {'у', "u"}, {'ф', "f"}, {'х', "h"}, {'ц', "ts"}, {'ч', "ch"},
        {'ш', "sh"}, {'щ', "sch"}, {'ъ', ""}, {'ы', "y"}, {'ь', ""},
        {'э', "e"}, {'ю', "yu"}, {'я', "ya"},
        {'А', "a"}, {'Б', "b"}, {'В', "v"}, {'Г', "g"}, {'Д', "d"},
        {'Е', "e"}, {'Ё', "yo"}, {'Ж', "zh"}, {'З', "z"}, {'И', "i"},
        {'Й', "y"}, {'К', "k"}, {'Л', "l"}, {'М', "m"}, {'Н', "n"},
        {'О', "o"}, {'П', "p"}, {'Р', "r"}, {'С', "s"}, {'Т', "t"},
        {'У', "u"}, {'Ф', "f"}, {'Х', "h"}, {'Ц', "ts"}, {'Ч', "ch"},
        {'Ш', "sh"}, {'Щ', "sch"}, {'Ъ', ""}, {'Ы', "y"}, {'Ь', ""},
        {'Э', "e"}, {'Ю', "yu"}, {'Я', "ya"}
    };

    public string Transliterate(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var result = new StringBuilder();
        
        foreach (var ch in text)
        {
            if (CyrillicToLatinMap.TryGetValue(ch, out var latinChar))
            {
                result.Append(latinChar);
            }
            else if (char.IsLetterOrDigit(ch))
            {
                result.Append(char.ToLower(ch));
            }
            else if (char.IsWhiteSpace(ch) || ch == '-' || ch == '_')
            {
                result.Append('-');
            }
        }

        var slug = result.ToString()
            .ToLowerInvariant()
            .Trim('-');
        
        // Replace multiple dashes with single dash
        slug = Regex.Replace(slug, "-+", "-");
        
        return slug;
    }

    public string GenerateSlug(string name, int? suffix = null)
    {
        var baseSlug = Transliterate(name);
        
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = "trainer";
        
        if (suffix.HasValue)
            return $"{baseSlug}-{suffix}";
        
        return baseSlug;
    }
}
